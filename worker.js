// Cloudflare Worker for Just Sticky Notes
// 완전 독립형 Workers 구조

import { HTML_CONTENT, JS_CONTENT } from './static-content.js';

// 전역 변수 및 설정
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 연결된 WebSocket 클라이언트들을 저장할 Map
let connectedClients = new Map();
let lastCleanupTime = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5분마다 정리

export default {
    async fetch(request, env, ctx) {
        try {
            const url = new URL(request.url);
            
            // 디버깅용 로그
            console.log(`요청: ${request.method} ${url.pathname}`);
            
            // CORS preflight 처리
            if (request.method === 'OPTIONS') {
                return new Response(null, {
                    status: 200,
                    headers: CORS_HEADERS
                });
            }
            
            // WebSocket 업그레이드 요청 처리
            if (url.pathname === '/ws') {
                return handleWebSocketUpgrade(request, env);
            }
            
            // API 라우팅
            if (url.pathname.startsWith('/api/')) {
                return handleAPI(request, env, url);
            }
            
            // 정적 파일 서빙
            return handleStaticFile(url.pathname, env);
        } catch (error) {
            console.error('Worker 최상위 오류:', error);
            return new Response('Internal Server Error: ' + error.message, { 
                status: 500,
                headers: CORS_HEADERS
            });
        }
    }
};

// 정적 파일 처리
async function handleStaticFile(pathname, env) {
    // 루트 경로는 index.html로 처리
    if (pathname === '/' || pathname === '/index.html') {
        // JS 내용을 HTML에 삽입
        let htmlContent = HTML_CONTENT.replace('\\${JS_PLACEHOLDER}', JS_CONTENT);
        
        return new Response(htmlContent, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                ...CORS_HEADERS
            }
        });
    }
    
    // 404 처리
    return new Response('Not Found', { 
        status: 404,
        headers: CORS_HEADERS
    });
}

// WebSocket 업그레이드 처리
async function handleWebSocketUpgrade(request, env) {
    try {
        const upgradeHeader = request.headers.get('Upgrade');
        if (!upgradeHeader || upgradeHeader !== 'websocket') {
            return new Response('Expected Upgrade: websocket', { status: 426 });
        }
        
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);
        
        // WebSocket 이벤트 처리
        server.accept();
        handleWebSocketConnection(server, env);
        
        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    } catch (error) {
        console.error('WebSocket 업그레이드 오류:', error);
        return new Response('WebSocket Error: ' + error.message, { 
            status: 500,
            headers: CORS_HEADERS
        });
    }
}

// WebSocket 연결 처리
function handleWebSocketConnection(websocket, env) {
    const clientId = generateClientId();
    
    // 클라이언트 등록
    const clientInfo = {
        websocket: websocket,
        user: null,
        lastSeen: Date.now(),
        isConnected: true
    };
    connectedClients.set(clientId, clientInfo);
    
    websocket.addEventListener('message', async (event) => {
        try {
            const client = connectedClients.get(clientId);
            if (client) {
                client.lastSeen = Date.now();
            }
            
            const data = JSON.parse(event.data);
            await handleWebSocketMessage(clientId, data, env);
        } catch (error) {
            console.error('WebSocket 메시지 처리 오류:', error);
            safeWebSocketSend(websocket, {
                type: 'error',
                message: '메시지 처리 중 오류가 발생했습니다.'
            });
        }
    });
    
    websocket.addEventListener('close', () => {
        handleClientDisconnect(clientId);
    });
    
    websocket.addEventListener('error', (error) => {
        console.error('WebSocket 오류:', error);
        handleClientDisconnect(clientId);
    });
    
    performPeriodicCleanup();
}

// WebSocket 메시지 처리
async function handleWebSocketMessage(clientId, data, env) {
    const client = connectedClients.get(clientId);
    if (!client || !client.isConnected) return;
    
    try {
        switch (data.type || data.t) {
            case 'auth':
                client.user = data.user;
                broadcastMessage({
                    type: 'user_joined',
                    user: data.user
                }, clientId);
                
                safeWebSocketSend(client.websocket, {
                    type: 'auth_success',
                    user: data.user,
                    timestamp: Date.now()
                });
                break;
                
            case 'load_notes':
                await loadAndSendNotes(client.websocket, env);
                break;
                
            case 'create_note':
                await handleNoteCreation(data, clientId, env);
                break;
                
            case 'update_note':
            case 'u':
                await handleNoteUpdate(data, clientId, env);
                break;
                
            case 'delete_note':
                await handleNoteDeletion(data, clientId, env);
                break;
                
            case 'sync_request':
                await loadAndSendSync(client.websocket, env, data.timestamp);
                break;
                
            case 'ping':
                safeWebSocketSend(client.websocket, {
                    type: 'pong',
                    timestamp: Date.now()
                });
                break;
        }
    } catch (error) {
        console.error('메시지 처리 오류:', error);
        safeWebSocketSend(client.websocket, {
            type: 'error',
            message: '요청 처리 중 오류가 발생했습니다.'
        });
    }
}

// 노트 생성 처리
async function handleNoteCreation(data, clientId, env) {
    const client = connectedClients.get(clientId);
    if (!client?.user) return;
    
    const note = {
        id: data.id || generateNoteId(),
        x: data.x,
        y: data.y,
        color: data.color,
        text: data.text || '',
        author: client.user.name,
        authorId: client.user.id,
        rotation: data.rotation || 0,
        timestamp: Date.now(),
        drawing: data.drawing || null
    };
    
    // R2에 저장
    await saveNoteToR2(env, note);
    
    // 모든 클라이언트에게 브로드캐스트
    broadcastMessage({
        type: 'note_created',
        note: note
    });
}

// 노트 업데이트 처리
async function handleNoteUpdate(data, clientId, env) {
    const client = connectedClients.get(clientId);
    if (!client?.user) return;
    
    // R2에서 노트 위치 업데이트
    await updateNoteInR2(env, data.id || data.id, data.x, data.y);
    
    // 다른 클라이언트들에게 즉시 브로드캐스트 (축약된 형태)
    broadcastMessage({
        t: 'nu', // note_updated 축약
        id: data.id,
        x: Math.round(data.x),
        y: Math.round(data.y), 
        c: data.c || clientId // clientId
    }, clientId);
}

// API 요청 처리
async function handleAPI(request, env, url) {
    const pathname = url.pathname;
    const method = request.method;
    
    try {
        switch (pathname) {
            case '/api/health':
                return new Response(JSON.stringify({
                    status: 'ok',
                    timestamp: Date.now(),
                    version: '2.0.0-workers'
                }), {
                    headers: {
                        'Content-Type': 'application/json',
                        ...CORS_HEADERS
                    }
                });
                
            case '/api/notes':
                if (method === 'GET') {
                    const notes = await loadNotesFromR2(env);
                    return new Response(JSON.stringify({ notes }), {
                        headers: {
                            'Content-Type': 'application/json',
                            ...CORS_HEADERS
                        }
                    });
                }
                break;
                
            case '/api/debug':
                return new Response(JSON.stringify({
                    connectedClients: connectedClients.size,
                    environment: env.ENVIRONMENT || 'development',
                    timestamp: Date.now(),
                    r2Available: !!env.STICKY_NOTES_BUCKET
                }), {
                    headers: {
                        'Content-Type': 'application/json',
                        ...CORS_HEADERS
                    }
                });
        }
        
        return new Response('API endpoint not found', { 
            status: 404,
            headers: CORS_HEADERS
        });
    } catch (error) {
        console.error('API 오류:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...CORS_HEADERS
            }
        });
    }
}

// R2에서 노트 로드
async function loadNotesFromR2(env) {
    try {
        if (!env.STICKY_NOTES_BUCKET) {
            console.warn('R2 bucket이 바인딩되지 않음');
            return [];
        }
        
        const object = await env.STICKY_NOTES_BUCKET.get('notes.json');
        if (!object) {
            return [];
        }
        
        const notesData = await object.json();
        return Array.isArray(notesData.notes) ? notesData.notes : [];
    } catch (error) {
        console.error('R2에서 노트 로드 오류:', error);
        return [];
    }
}

// R2에 노트 저장
async function saveNoteToR2(env, note) {
    try {
        if (!env.STICKY_NOTES_BUCKET) {
            console.warn('R2 bucket이 바인딩되지 않음');
            return;
        }
        
        // 기존 노트들 로드
        const existingNotes = await loadNotesFromR2(env);
        
        // 새 노트 추가
        existingNotes.push(note);
        
        // 최대 1000개 노트만 유지
        if (existingNotes.length > 1000) {
            existingNotes.splice(0, existingNotes.length - 1000);
        }
        
        // R2에 저장
        await env.STICKY_NOTES_BUCKET.put('notes.json', JSON.stringify({
            notes: existingNotes,
            lastUpdated: Date.now()
        }));
        
        console.log('노트 저장됨:', note.id);
    } catch (error) {
        console.error('R2에 노트 저장 오류:', error);
    }
}

// R2에서 노트 위치 업데이트
async function updateNoteInR2(env, noteId, x, y) {
    try {
        if (!env.STICKY_NOTES_BUCKET) return;
        
        const existingNotes = await loadNotesFromR2(env);
        const noteIndex = existingNotes.findIndex(n => n.id === noteId);
        
        if (noteIndex !== -1) {
            existingNotes[noteIndex].x = x;
            existingNotes[noteIndex].y = y;
            existingNotes[noteIndex].lastUpdated = Date.now();
            
            await env.STICKY_NOTES_BUCKET.put('notes.json', JSON.stringify({
                notes: existingNotes,
                lastUpdated: Date.now()
            }));
        }
    } catch (error) {
        console.error('R2 노트 업데이트 오류:', error);
    }
}

// 유틸리티 함수들
function generateClientId() {
    return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateNoteId() {
    return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function safeWebSocketSend(websocket, message) {
    try {
        if (websocket && websocket.readyState === 1) {
            websocket.send(JSON.stringify(message));
            return true;
        }
        return false;
    } catch (error) {
        console.error('WebSocket 메시지 전송 오류:', error);
        return false;
    }
}

function broadcastMessage(message, excludeClientId = null) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;
    
    for (const [clientId, client] of connectedClients.entries()) {
        if (clientId !== excludeClientId && client.isConnected) {
            if (safeWebSocketSend(client.websocket, message)) {
                sentCount++;
            } else {
                // 전송 실패한 클라이언트는 연결 해제 처리
                handleClientDisconnect(clientId);
            }
        }
    }
    
    console.log(`메시지 브로드캐스트: ${sentCount}명에게 전송`);
}

function handleClientDisconnect(clientId) {
    try {
        const client = connectedClients.get(clientId);
        if (client) {
            client.isConnected = false;
            
            if (client.user) {
                broadcastMessage({
                    type: 'user_left',
                    user: client.user
                }, clientId);
            }
            
            connectedClients.delete(clientId);
        }
    } catch (error) {
        console.error('클라이언트 연결 해제 처리 오류:', error);
    }
}

async function loadAndSendNotes(websocket, env) {
    try {
        const notes = await loadNotesFromR2(env);
        safeWebSocketSend(websocket, {
            type: 'notes_loaded',
            notes: notes,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('노트 로드 및 전송 오류:', error);
        safeWebSocketSend(websocket, {
            type: 'error',
            message: '노트를 불러올 수 없습니다.'
        });
    }
}

async function loadAndSendSync(websocket, env, requestTimestamp) {
    try {
        const notes = await loadNotesFromR2(env);
        safeWebSocketSend(websocket, {
            type: 'sync_response',
            notes: notes,
            requestTimestamp: requestTimestamp,
            serverTimestamp: Date.now()
        });
    } catch (error) {
        console.error('동기화 오류:', error);
    }
}

function performPeriodicCleanup() {
    const now = Date.now();
    if (now - lastCleanupTime > CLEANUP_INTERVAL) {
        cleanupInactiveClients();
        lastCleanupTime = now;
    }
}

function cleanupInactiveClients() {
    const now = Date.now();
    const INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30분
    
    for (const [clientId, client] of connectedClients.entries()) {
        if (now - client.lastSeen > INACTIVE_TIMEOUT) {
            console.log('비활성 클라이언트 정리:', clientId);
            handleClientDisconnect(clientId);
        }
    }
}

async function handleNoteDeletion(data, clientId, env) {
    try {
        if (!env.STICKY_NOTES_BUCKET) return;
        
        const existingNotes = await loadNotesFromR2(env);
        const filteredNotes = existingNotes.filter(n => n.id !== data.noteId);
        
        if (filteredNotes.length !== existingNotes.length) {
            await env.STICKY_NOTES_BUCKET.put('notes.json', JSON.stringify({
                notes: filteredNotes,
                lastUpdated: Date.now()
            }));
            
            broadcastMessage({
                type: 'note_deleted',
                noteId: data.noteId
            });
        }
    } catch (error) {
        console.error('노트 삭제 오류:', error);
    }
} 