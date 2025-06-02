// 정적 콘텐츠 정의 파일
// 실제 프로덕션에서는 빌드 과정에서 외부 파일을 읽어와 내장

export const HTML_CONTENT = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Just Sticky Notes</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Kalam:wght@300;400;700&display=swap" rel="stylesheet">
    <style>
        /* Reset */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Kalam', cursive; overflow: hidden; height: 100vh; background: #8B4513; }
        .hidden { display: none !important; }

        /* 로그인 화면 */
        .login-screen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; z-index: 1000; }
        .wood-background { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #D2B48C 0%, #DEB887 25%, #F5DEB3 50%, #DEB887 75%, #D2B48C 100%); }
        .login-sticky-note { background: #FFEB3B; width: 200px; height: 200px; border-radius: 5px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3); cursor: pointer; transition: all 0.3s ease; transform: rotate(-5deg); position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Caveat', cursive; font-size: 18px; font-weight: 600; color: #333; }
        .login-sticky-note:hover { transform: rotate(-3deg) scale(1.05); }
        .google-icon { margin-bottom: 15px; animation: bounce 2s infinite; }
        @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-10px); } 60% { transform: translateY(-5px); } }
        .falling { animation: fall 1s ease-in forwards; }
        @keyframes fall { 0% { transform: rotate(-5deg) scale(1); opacity: 1; } 100% { transform: rotate(15deg) translateY(100vh) scale(0.8); opacity: 0; } }

        /* 메인 앱 */
        .app { width: 100vw; height: 100vh; position: relative; }
        .canvas-container { position: absolute; top: 0; left: 0; width: 100%; height: calc(100% - 80px); overflow: hidden; cursor: grab; }
        .canvas-container.grabbing { cursor: grabbing; }
        .canvas { position: absolute; width: 10000px; height: 10000px; transform-origin: 0 0; will-change: transform; }
        .wood-texture { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #D2B48C 0%, #DEB887 25%, #F5DEB3 50%, #DEB887 75%, #D2B48C 100%); }

        /* 도구바 */
        .toolbar { position: fixed; bottom: 0; left: 0; right: 0; height: 80px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; border-top: 1px solid rgba(0, 0, 0, 0.1); z-index: 100; }
        .tool-group { display: flex; gap: 10px; }
        .tool-btn { width: 50px; height: 50px; border: none; background: #f0f0f0; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
        .tool-btn:hover { background: #e0e0e0; transform: translateY(-2px); }
        .tool-btn.active { background: #2196F3; color: white; }
        .zoom-controls { display: flex; align-items: center; gap: 15px; }
        .zoom-btn { width: 40px; height: 40px; border: none; background: #f0f0f0; border-radius: 50%; cursor: pointer; font-size: 20px; font-weight: bold; }
        .user-info { display: flex; align-items: center; gap: 10px; }
        .user-avatar { width: 40px; height: 40px; border-radius: 50%; }
        .logout-btn { padding: 8px 16px; border: none; background: #f44336; color: white; border-radius: 5px; cursor: pointer; }

        /* 스티키 노트 */
        .sticky-note { position: absolute; width: 200px; min-height: 150px; border-radius: 5px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); padding: 15px; font-family: 'Caveat', cursive; font-size: 16px; transform-origin: center; transition: transform 0.2s ease; cursor: pointer; }
        .sticky-note:hover { transform: scale(1.02); }
        .sticky-note.draggable { cursor: move; }
        .note-content { height: 100%; display: flex; flex-direction: column; }
        .note-text { flex: 1; line-height: 1.5; word-wrap: break-word; overflow: hidden; }
        .note-author { font-size: 12px; color: rgba(0, 0, 0, 0.6); margin-top: 10px; text-align: right; }

        /* 노트 에디터 */
        .note-editor-modal { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
        .note-editor-content { background: white; border-radius: 15px; padding: 20px; max-width: 400px; width: 90%; max-height: 80vh; overflow: auto; }
        .note-editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; }
        .color-picker { display: flex; gap: 10px; margin-bottom: 20px; }
        .color-btn { width: 30px; height: 30px; border: 2px solid transparent; border-radius: 50%; cursor: pointer; }
        .color-btn.selected { border-color: #333; }
        .sticky-note-preview { background: #FFEB3B; border-radius: 5px; padding: 15px; position: relative; min-height: 200px; }
        .note-tools { display: flex; gap: 5px; margin-bottom: 10px; }
        .note-canvas-container { position: relative; }
        #unified-canvas { position: absolute; top: 0; left: 0; border-radius: 5px; }
        #note-text-overlay { width: 100%; height: 200px; background: transparent; border: none; resize: none; font-family: 'Caveat', cursive; font-size: 16px; color: #333; outline: none; }
        .note-actions { display: flex; gap: 10px; margin-top: 20px; }
        .save-btn, .cancel-btn { flex: 1; padding: 12px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        .save-btn { background: #4CAF50; color: white; }
        .cancel-btn { background: #f44336; color: white; }

        /* 상태 및 알림 */
        .connection-status { position: fixed; top: 20px; right: 20px; background: rgba(255, 255, 255, 0.9); padding: 8px 12px; border-radius: 20px; font-size: 12px; z-index: 1000; }
        .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; }
        .connection-status.connected .status-dot { background: #4CAF50; }
        .connection-status.connecting .status-dot { background: #FF9800; animation: pulse 1s infinite; }
        .connection-status.disconnected .status-dot { background: #f44336; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        
        /* 캔버스 모드 */
        .canvas-container.note-mode { cursor: crosshair; }
        .canvas-container.move-mode { cursor: grab; }
        .canvas-container.move-mode.grabbing { cursor: grabbing; }

        /* 반응형 */
        @media (max-width: 768px) {
            .note-editor-content { margin: 20px; }
            .sticky-note { width: 180px; min-height: 120px; font-size: 14px; }
        }
    </style>
</head>
<body>
    <!-- 로그인 화면 -->
    <div id="login-screen" class="login-screen">
        <div class="wood-background"></div>
        <div class="login-sticky-note" id="loginNote">
            <div class="google-icon">
                <svg viewBox="0 0 24 24" width="48" height="48">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
            </div>
            <p>구글로 로그인하기</p>
        </div>
    </div>

    <!-- 메인 앱 -->
    <div id="app" class="app hidden">
        <!-- 연결 상태 -->
        <div id="connection-status" class="connection-status disconnected">
            <span class="status-dot"></span>
            <span id="status-text">연결 중...</span>
        </div>

        <!-- 무한 캔버스 -->
        <div id="canvas-container" class="canvas-container">
            <div id="canvas" class="canvas">
                <div class="wood-texture"></div>
                <!-- 스티키 노트들이 여기에 렌더링됩니다 -->
            </div>
        </div>

        <!-- 도구 바 -->
        <div class="toolbar">
            <div class="tool-group">
                <button id="move-tool" class="tool-btn active" title="이동 도구">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M13,11H18L16.5,9.5L17.92,8.08L21.84,12L17.92,15.92L16.5,14.5L18,13H13V18L14.5,16.5L15.92,17.92L12,21.84L8.08,17.92L9.5,16.5L11,18V13H6L7.5,14.5L6.08,15.92L2.16,12L6.08,8.08L7.5,9.5L6,11H11V6L9.5,7.5L8.08,6.08L12,2.16L15.92,6.08L14.5,7.5L13,6V11Z"/>
                    </svg>
                </button>
                <button id="note-tool" class="tool-btn" title="스티키 노트 생성">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M3,3H21A2,2 0 0,1 23,5V17A2,2 0 0,1 21,19H14L12,21L10,19H3A2,2 0 0,1 1,17V5A2,2 0 0,1 3,3M3,5V17H10.83L12,18.17L13.17,17H21V5H3Z"/>
                    </svg>
                </button>
            </div>
            
            <div class="zoom-controls">
                <button id="zoom-out" class="zoom-btn" title="축소">-</button>
                <span id="zoom-level">100%</span>
                <button id="zoom-in" class="zoom-btn" title="확대">+</button>
            </div>

            <div class="user-info">
                <img id="user-avatar" class="user-avatar" src="" alt="프로필">
                <span id="user-name"></span>
                <button id="logout-btn" class="logout-btn" title="로그아웃">로그아웃</button>
            </div>
        </div>
    </div>

    <!-- 스티키 노트 에디터 모달 -->
    <div id="note-editor" class="note-editor-modal hidden">
        <div class="note-editor-content">
            <div class="note-editor-header">
                <h3>스티키 노트</h3>
                <button id="close-editor" class="close-btn">&times;</button>
            </div>
            <div class="note-editor-body">
                <div class="color-picker">
                    <button class="color-btn" data-color="#FFEB3B" style="background: #FFEB3B"></button>
                    <button class="color-btn" data-color="#FF9800" style="background: #FF9800"></button>
                    <button class="color-btn" data-color="#E91E63" style="background: #E91E63"></button>
                    <button class="color-btn" data-color="#9C27B0" style="background: #9C27B0"></button>
                    <button class="color-btn" data-color="#2196F3" style="background: #2196F3"></button>
                    <button class="color-btn" data-color="#4CAF50" style="background: #4CAF50"></button>
                </div>
                
                <!-- 통합 스티키 노트 캔버스 -->
                <div class="sticky-note-preview" id="stickyNotePreview">
                    <div class="note-tools">
                        <button id="text-tool" class="tool-btn active" title="텍스트">✏️</button>
                        <button id="pen-tool" class="tool-btn" title="펜">🖊️</button>
                        <button id="underline-tool" class="tool-btn" title="밑줄">_</button>
                        <button id="circle-tool" class="tool-btn" title="동그라미">○</button>
                        <button id="clear-all" class="tool-btn" title="모두 지우기">🗑️</button>
                    </div>
                    
                    <div class="note-canvas-container">
                        <canvas id="unified-canvas" width="280" height="200"></canvas>
                        <textarea id="note-text-overlay" placeholder="여기에 글을 쓰세요..." 
                                maxlength="500" spellcheck="false"></textarea>
                    </div>
                </div>
                
                <div class="note-actions">
                    <button id="save-note" class="save-btn">붙이기</button>
                    <button id="cancel-note" class="cancel-btn">취소</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        \${JS_PLACEHOLDER}
    </script>
</body>
</html>`;

export const JS_CONTENT = 
`// 전역 변수
let currentUser = null;
let currentTool = 'move';
let zoomLevel = 1;
let panX = -4000;
let panY = -4000;
let stickyNotes = [];
let ws = null;
let selectedColor = '#FFEB3B';
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let draggedNote = null;
let isDraggingNote = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// DOM 요소들
const loginScreen = document.getElementById('login-screen');
const app = document.getElementById('app');
const loginNote = document.getElementById('loginNote');
const canvas = document.getElementById('canvas');
const canvasContainer = document.getElementById('canvas-container');
const moveToolBtn = document.getElementById('move-tool');
const noteToolBtn = document.getElementById('note-tool');
const noteEditor = document.getElementById('note-editor');
const connectionStatus = document.getElementById('connection-status');
const statusText = document.getElementById('status-text');

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    connectWebSocket();
});

function setupEventListeners() {
    loginNote.addEventListener('click', handleGoogleLogin);
    moveToolBtn.addEventListener('click', () => setTool('move'));
    noteToolBtn.addEventListener('click', () => setTool('note'));
    
    // 캔버스 이벤트
    canvasContainer.addEventListener('mousedown', handleCanvasMouseDown);
    canvasContainer.addEventListener('mousemove', handleCanvasMouseMove);
    canvasContainer.addEventListener('mouseup', handleCanvasMouseUp);
    canvasContainer.addEventListener('wheel', handleCanvasWheel);
    
    // 줌 컨트롤
    document.getElementById('zoom-in').addEventListener('click', () => zoom(1.2));
    document.getElementById('zoom-out').addEventListener('click', () => zoom(0.8));
    
    // 노트 에디터
    document.getElementById('close-editor').addEventListener('click', closeNoteEditor);
    document.getElementById('save-note').addEventListener('click', saveNote);
    document.getElementById('cancel-note').addEventListener('click', closeNoteEditor);
    
    // 색상 선택
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedColor = btn.dataset.color;
            updateStickyNotePreview();
        });
    });
    
    // 키보드 단축키
    document.addEventListener('keydown', (e) => {
        if (e.key === 'M' || e.key === 'm') setTool('move');
        if (e.key === 'N' || e.key === 'n') setTool('note');
        if (e.key === '+' || e.key === '=') zoom(1.2);
        if (e.key === '-') zoom(0.8);
    });
}

async function handleGoogleLogin() {
    loginNote.classList.add('falling');
    setTimeout(() => {
        currentUser = { 
            id: 'demo_' + Date.now(), 
            name: 'Demo User', 
            avatar: 'https://via.placeholder.com/40' 
        };
        showApp();
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'auth', user: currentUser }));
        }
    }, 1000);
}

function showApp() {
    loginScreen.classList.add('hidden');
    app.classList.remove('hidden');
    if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.name;
        document.getElementById('user-avatar').src = currentUser.avatar;
    }
}

function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    if (tool === 'move') moveToolBtn.classList.add('active');
    if (tool === 'note') noteToolBtn.classList.add('active');
    
    canvasContainer.className = 'canvas-container ' + tool + '-mode';
}

function handleCanvasMouseDown(e) {
    const rect = canvasContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 노트 클릭 확인
    const clickedNote = findNoteAtPosition(x, y);
    
    if (clickedNote && currentUser && clickedNote.authorId === currentUser.id) {
        // 내 노트 드래그 시작
        isDraggingNote = true;
        draggedNote = clickedNote;
        const noteElement = document.querySelector('[data-note-id="' + clickedNote.id + '"]');
        if (noteElement) {
            const noteRect = noteElement.getBoundingClientRect();
            const containerRect = canvasContainer.getBoundingClientRect();
            dragOffsetX = e.clientX - noteRect.left;
            dragOffsetY = e.clientY - noteRect.top;
        }
        return;
    }
    
    if (currentTool === 'move') {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvasContainer.classList.add('grabbing');
    } else if (currentTool === 'note') {
        openNoteEditor(e);
    }
}

function handleCanvasMouseMove(e) {
    if (isDraggingNote && draggedNote) {
        // 노트 드래그
        const rect = canvasContainer.getBoundingClientRect();
        const worldX = (e.clientX - rect.left - panX - dragOffsetX) / zoomLevel;
        const worldY = (e.clientY - rect.top - panY - dragOffsetY) / zoomLevel;
        
        updateNotePosition(draggedNote.id, worldX, worldY);
        return;
    }
    
    if (isDragging && currentTool === 'move') {
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        panX += deltaX;
        panY += deltaY;
        updateCanvasTransform();
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    }
}

function handleCanvasMouseUp(e) {
    isDragging = false;
    isDraggingNote = false;
    draggedNote = null;
    canvasContainer.classList.remove('grabbing');
}

function handleCanvasWheel(e) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    zoom(factor);
}

function zoom(factor) {
    zoomLevel = Math.max(0.1, Math.min(3, zoomLevel * factor));
    updateCanvasTransform();
    document.getElementById('zoom-level').textContent = Math.round(zoomLevel * 100) + '%';
}

function updateCanvasTransform() {
    canvas.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoomLevel + ')';
}

function openNoteEditor(e) {
    noteEditor.classList.remove('hidden');
    updateStickyNotePreview();
}

function closeNoteEditor() {
    noteEditor.classList.add('hidden');
    document.getElementById('note-text-overlay').value = '';
}

function updateStickyNotePreview() {
    const preview = document.getElementById('stickyNotePreview');
    preview.style.background = selectedColor;
}

async function saveNote() {
    const text = document.getElementById('note-text-overlay').value.trim();
    if (!text) return;
    
    const rect = canvasContainer.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const worldX = (centerX - panX) / zoomLevel;
    const worldY = (centerY - panY) / zoomLevel;
    
    const note = {
        id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        x: worldX,
        y: worldY,
        color: selectedColor,
        text: text,
        author: currentUser?.name || 'Anonymous',
        authorId: currentUser?.id || 'anonymous',
        rotation: (Math.random() - 0.5) * 10, // -5도 ~ +5도
        timestamp: Date.now()
    };
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'create_note',
            ...note
        }));
    }
    
    closeNoteEditor();
}

function connectWebSocket() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = protocol + '//' + location.host + '/ws';
    
    updateConnectionStatus('connecting');
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('WebSocket 연결됨');
        updateConnectionStatus('connected');
        if (currentUser) {
            ws.send(JSON.stringify({ type: 'auth', user: currentUser }));
        }
        ws.send(JSON.stringify({ type: 'load_notes' }));
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };
    
    ws.onclose = () => {
        console.log('WebSocket 연결 끊김');
        updateConnectionStatus('disconnected');
        setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket 오류:', error);
        updateConnectionStatus('disconnected');
    };
}

function updateConnectionStatus(status) {
    connectionStatus.className = 'connection-status ' + status;
    switch (status) {
        case 'connected':
            statusText.textContent = '연결됨';
            break;
        case 'connecting':
            statusText.textContent = '연결 중...';
            break;
        case 'disconnected':
            statusText.textContent = '연결 끊김';
            break;
    }
}

function handleWebSocketMessage(data) {
    switch (data.type || data.t) {
        case 'notes_loaded':
            stickyNotes = data.notes || [];
            renderAllNotes();
            break;
        case 'note_created':
            if (!stickyNotes.find(n => n.id === data.note.id)) {
                stickyNotes.push(data.note);
                renderStickyNote(data.note);
            }
            break;
        case 'nu': // note_updated (축약형)
        case 'note_updated':
            updateExistingNote(data);
            break;
        case 'note_deleted':
            removeNoteFromDOM(data.noteId);
            break;
        case 'user_joined':
            console.log('사용자 입장:', data.user?.name);
            break;
        case 'user_left':
            console.log('사용자 퇴장:', data.user?.name);
            break;
        case 'pong':
            // heartbeat 응답
            break;
    }
}

function renderAllNotes() {
    // 기존 노트 요소들 제거 (wood-texture는 유지)
    const existingNotes = canvas.querySelectorAll('.sticky-note');
    existingNotes.forEach(note => note.remove());
    
    // 모든 노트 렌더링
    stickyNotes.forEach(note => renderStickyNote(note));
}

function renderStickyNote(note) {
    // 기존 노트가 있으면 제거
    const existingNote = document.querySelector('[data-note-id="' + note.id + '"]');
    if (existingNote) {
        existingNote.remove();
    }
    
    const noteElement = document.createElement('div');
    noteElement.className = 'sticky-note';
    noteElement.dataset.noteId = note.id;
    noteElement.style.left = note.x + 'px';
    noteElement.style.top = note.y + 'px';
    noteElement.style.background = note.color;
    noteElement.style.transform = 'rotate(' + (note.rotation || 0) + 'deg)';
    
    // 내 노트인 경우 드래그 가능
    if (currentUser && note.authorId === currentUser.id) {
        noteElement.classList.add('draggable');
    }
    
    noteElement.innerHTML = 
        '<div class="note-content">' +
            '<div class="note-text">' + escapeHtml(note.text || '') + '</div>' +
            '<div class="note-author">' + escapeHtml(note.author || 'Anonymous') + '</div>' +
        '</div>';
    
    canvas.appendChild(noteElement);
}

function updateExistingNote(data) {
    const note = stickyNotes.find(n => n.id === data.id);
    if (note) {
        note.x = data.x;
        note.y = data.y;
        
        const noteElement = document.querySelector('[data-note-id="' + data.id + '"]');
        if (noteElement) {
            noteElement.style.left = data.x + 'px';
            noteElement.style.top = data.y + 'px';
        }
    }
}

function updateNotePosition(noteId, x, y) {
    const note = stickyNotes.find(n => n.id === noteId);
    if (note) {
        note.x = x;
        note.y = y;
        
        const noteElement = document.querySelector('[data-note-id="' + noteId + '"]');
        if (noteElement) {
            noteElement.style.left = x + 'px';
            noteElement.style.top = y + 'px';
        }
        
        // 서버에 위치 업데이트 전송
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                t: 'u', // update_note 축약
                id: noteId,
                x: Math.round(x),
                y: Math.round(y),
                c: currentUser?.id
            }));
        }
    }
}

function findNoteAtPosition(x, y) {
    // 화면 좌표를 월드 좌표로 변환
    const worldX = (x - panX) / zoomLevel;
    const worldY = (y - panY) / zoomLevel;
    
    // 역순으로 검사 (위에 있는 노트부터)
    for (let i = stickyNotes.length - 1; i >= 0; i--) {
        const note = stickyNotes[i];
        if (worldX >= note.x && worldX <= note.x + 200 &&
            worldY >= note.y && worldY <= note.y + 150) {
            return note;
        }
    }
    return null;
}

function removeNoteFromDOM(noteId) {
    const noteElement = document.querySelector('[data-note-id="' + noteId + '"]');
    if (noteElement) {
        noteElement.remove();
    }
    stickyNotes = stickyNotes.filter(n => n.id !== noteId);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 주기적 ping 전송
setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
    }
}, 30000);`; 