// ==================== GLOBAL STATE ====================
let currentUser = null;
let currentTab = 'chatListPage';
let currentChatPeer = null;
let socket = null;
let chatMessages = [];

// 104 avatars: id used as data-avatar, emoji as display, color as background
const AVATAR_LIST = [
    { id:'fox', emoji:'🦊', color:'#FF6B35' },
    { id:'cat', emoji:'🐱', color:'#F5A623' },
    { id:'dog', emoji:'🐶', color:'#8B5E3C' },
    { id:'mouse', emoji:'🐭', color:'#9B59B6' },
    { id:'snake', emoji:'🐍', color:'#4CAF50' },
    { id:'dragon', emoji:'🐲', color:'#E74C3C' },
    { id:'fish', emoji:'🐟', color:'#3498DB' },
    { id:'human', emoji:'🧑', color:'#1ABC9C' },
    { id:'lion', emoji:'🦁', color:'#E67E22' },
    { id:'tiger', emoji:'🐯', color:'#F39C12' },
    { id:'bear', emoji:'🐻', color:'#795548' },
    { id:'panda', emoji:'🐼', color:'#2C3E50' },
    { id:'monkey', emoji:'🐵', color:'#D4A574' },
    { id:'rabbit', emoji:'🐰', color:'#E91E63' },
    { id:'pig', emoji:'🐷', color:'#FFB6C1' },
    { id:'cow', emoji:'🐮', color:'#5D4037' },
    { id:'frog', emoji:'🐸', color:'#66BB6A' },
    { id:'chicken', emoji:'🐔', color:'#FF7043' },
    { id:'penguin', emoji:'🐧', color:'#37474F' },
    { id:'bird', emoji:'🐦', color:'#03A9F4' },
    { id:'owl', emoji:'🦉', color:'#6D4C41' },
    { id:'eagle', emoji:'🦅', color:'#5D4037' },
    { id:'bat', emoji:'🦇', color:'#7B1FA2' },
    { id:'wolf', emoji:'🐺', color:'#607D8B' },
    { id:'horse', emoji:'🐴', color:'#8D6E63' },
    { id:'unicorn', emoji:'🦄', color:'#CE93D8' },
    { id:'deer', emoji:'🦌', color:'#A1887F' },
    { id:'gorilla', emoji:'🦍', color:'#3E2723' },
    { id:'hamster', emoji:'🐹', color:'#FFAB91' },
    { id:'koala', emoji:'🐨', color:'#9E9E9E' },
    { id:'whale', emoji:'🐳', color:'#1565C0' },
    { id:'dolphin', emoji:'🐬', color:'#42A5F5' },
    { id:'octopus', emoji:'🐙', color:'#E040FB' },
    { id:'crab', emoji:'🦀', color:'#F44336' },
    { id:'lobster', emoji:'🦞', color:'#C62828' },
    { id:'shrimp', emoji:'🦐', color:'#FF5252' },
    { id:'turtle', emoji:'🐢', color:'#388E3C' },
    { id:'crocodile', emoji:'🐊', color:'#33691E' },
    { id:'lizard', emoji:'🦎', color:'#689F38' },
    { id:'bug', emoji:'🐛', color:'#8BC34A' },
    { id:'butterfly', emoji:'🦋', color:'#AB47BC' },
    { id:'bee', emoji:'🐝', color:'#FFC107' },
    { id:'ant', emoji:'🐜', color:'#212121' },
    { id:'spider', emoji:'🕷️', color:'#1B5E20' },
    { id:'scorpion', emoji:'🦂', color:'#880E4F' },
    { id:'cactus', emoji:'🌵', color:'#2E7D32' },
    { id:'flower', emoji:'🌸', color:'#F48FB1' },
    { id:'rose', emoji:'🌹', color:'#D32F2F' },
    { id:'sunflower', emoji:'🌻', color:'#FFD54F' },
    { id:'mushroom', emoji:'🍄', color:'#D84315' },
    { id:'tree', emoji:'🌳', color:'#1B5E20' },
    { id:'palm', emoji:'🌴', color:'#4E342E' },
    { id:'cherry', emoji:'🍒', color:'#C62828' },
    { id:'apple', emoji:'🍎', color:'#E53935' },
    { id:'orange', emoji:'🍊', color:'#FF9800' },
    { id:'lemon', emoji:'🍋', color:'#FDD835' },
    { id:'grape', emoji:'🍇', color:'#7B1FA2' },
    { id:'watermelon', emoji:'🍉', color:'#43A047' },
    { id:'strawberry', emoji:'🍓', color:'#E91E63' },
    { id:'peach', emoji:'🍑', color:'#FFAB91' },
    { id:'pineapple', emoji:'🍍', color:'#F9A825' },
    { id:'banana', emoji:'🍌', color:'#FFEB3B' },
    { id:'avocado', emoji:'🥑', color:'#558B2F' },
    { id:'pizza', emoji:'🍕', color:'#F57C00' },
    { id:'burger', emoji:'🍔', color:'#BF360C' },
    { id:'taco', emoji:'🌮', color:'#FFA726' },
    { id:'donut', emoji:'🍩', color:'#E91E63' },
    { id:'cake', emoji:'🎂', color:'#F48FB1' },
    { id:'cookie', emoji:'🍪', color:'#8D6E63' },
    { id:'icecream', emoji:'🍦', color:'#FFCCBC' },
    { id:'rocket', emoji:'🚀', color:'#455A64' },
    { id:'star', emoji:'⭐', color:'#FFC107' },
    { id:'moon', emoji:'🌙', color:'#FDD835' },
    { id:'sun', emoji:'☀️', color:'#FF9800' },
    { id:'rainbow', emoji:'🌈', color:'#00BCD4' },
    { id:'fire', emoji:'🔥', color:'#FF5722' },
    { id:'water', emoji:'💧', color:'#2196F3' },
    { id:'lightning', emoji:'⚡', color:'#FFEB3B' },
    { id:'snowflake', emoji:'❄️', color:'#81D4FA' },
    { id:'crystal', emoji:'💎', color:'#CE93D8' },
    { id:'crown', emoji:'👑', color:'#FFD700' },
    { id:'ghost', emoji:'👻', color:'#B39DDB' },
    { id:'alien', emoji:'👽', color:'#4CAF50' },
    { id:'robot', emoji:'🤖', color:'#607D8B' },
    { id:'clown', emoji:'🤡', color:'#E53935' },
    { id:'ninja', emoji:'🥷', color:'#1A1A1A' },
    { id:'princess', emoji:'👸', color:'#F48FB1' },
    { id:'wizard', emoji:'🧙', color:'#7B1FA2' },
    { id:'mermaid', emoji:'🧜', color:'#00BCD4' },
    { id:'vampire', emoji:'🧛', color:'#37474F' },
    { id:'zombie', emoji:'�', color:'#558B2F' },
    { id:'superhero', emoji:'🦸', color:'#F44336' },
    { id:'angel', emoji:'�', color:'#FFF9C4' },
    { id:'skull', emoji:'�', color:'#ECEFF1' },
    { id:'brain', emoji:'🧠', color:'#F48FB1' },
    { id:'eye', emoji:'�️', color:'#795548' },
    { id:'heart', emoji:'❤️', color:'#F44336' },
    { id:'music', emoji:'🎵', color:'#7B1FA2' },
    { id:'guitar', emoji:'🎸', color:'#D84315' },
    { id:'piano', emoji:'🎹', color:'#212121' },
    { id:'art', emoji:'🎨', color:'#E91E63' },
    { id:'camera', emoji:'�', color:'#37474F' },
    { id:'book', emoji:'📚', color:'#1565C0' },
    { id:'palette', emoji:'🎨', color:'#FF7043' }
];

function getAvatarColor(id) {
    const av = AVATAR_LIST.find(a => a.id === id);
    return av ? av.color : '#999';
}
function getAvatarEmoji(id) {
    const av = AVATAR_LIST.find(a => a.id === id);
    return av ? av.emoji : '❓';
}
function avatarStyle(id, size) {
    return `background:${getAvatarColor(id)};width:${size}px;height:${size}px;min-width:${size}px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.45)}px;flex-shrink:0;`;
}
function avatarCircleStyle(id, size) {
    return `background:${getAvatarColor(id)};width:${size}px;height:${size}px;min-width:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.4)}px;flex-shrink:0;`;
}

// ==================== PHASE 1: AUTH ====================

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-tab').forEach(t => {
        if (t.textContent.toLowerCase().includes(tab)) t.classList.add('active');
    });
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('authError').textContent = '';
}

document.addEventListener('DOMContentLoaded', () => {
    buildAvatarPicker('regAvatarPicker');
    buildAvatarPicker('editAvatarPicker');
});

function buildAvatarPicker(pickerId) {
    const el = document.getElementById(pickerId);
    if (!el) return;
    el.innerHTML = AVATAR_LIST.map((av, i) => `
        <span class="avatar-option${i === 0 ? ' selected' : ''}" data-avatar="${av.id}" style="background:${av.color}33;color:${av.color};border:2px solid ${i===0?av.color:'#ddd'};">
            ${av.emoji}
        </span>
    `).join('');
    // Click handler
    el.querySelectorAll('.avatar-option').forEach(opt => {
        opt.addEventListener('click', function() {
            const color = getAvatarColor(this.dataset.avatar);
            el.querySelectorAll('.avatar-option').forEach(o => {
                o.classList.remove('selected');
                o.style.borderColor = '#ddd';
            });
            this.classList.add('selected');
            this.style.borderColor = color;
        });
    });
}

function getSelectedAvatar(pickerId) {
    const sel = document.querySelector('#' + pickerId + ' .avatar-option.selected');
    return sel ? sel.dataset.avatar : 'fox';
}

function doRegister() {
    const username = document.getElementById('regUsername').value.trim();
    const nickname = document.getElementById('regNickname').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const bio = document.getElementById('regBio').value.trim();
    const avatar = getSelectedAvatar('regAvatarPicker');
    const errEl = document.getElementById('authError');

    if (!username || !password) { errEl.textContent = 'Username and password required'; return; }

    fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, nickname, avatar, bio })
    })
    .then(r => r.json())
    .then(data => {
        if (data.error) { errEl.textContent = data.error; return; }
        setCurrentUser({ uid: data.uid, nickname: data.nickname, avatar: data.avatar, bio: data.bio, role: data.role, username });
        enterApp();
    });
}

function doLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errEl = document.getElementById('authError');
    if (!username || !password) { errEl.textContent = 'Username and password required'; return; }

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(r => r.json())
    .then(data => {
        if (data.error) { errEl.textContent = data.error; return; }
        setCurrentUser({ uid: data.uid, nickname: data.nickname, avatar: data.avatar, bio: data.bio, role: data.role, username });
        enterApp();
    });
}

function setCurrentUser(user) {
    currentUser = user;
}

function enterApp() {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    updateProfileUI();
    loadChatList();
    connectSocket();
}

function doLogout() {
    if (socket) { socket.disconnect(); socket = null; }
    currentUser = null; currentChatPeer = null;
    chatMessages = [];
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('authPage').style.display = 'flex';
}

// ==================== PHASE 1: PROFILE EDITING ====================

function updateProfileUI() {
    document.getElementById('profileNickname').textContent = currentUser.nickname;
    document.getElementById('profileUsername').textContent = '@' + currentUser.username;
    document.getElementById('profileBio').textContent = currentUser.bio || '';
    document.getElementById('profileAvatar').style.cssText = avatarCircleStyle(currentUser.avatar, 72);
    document.getElementById('profileAvatar').textContent = getAvatarEmoji(currentUser.avatar);

    // Admin panel
    if (currentUser.role === 'admin') {
        document.getElementById('adminPanel').style.display = 'block';
    }
}

function showEditProfile() {
    document.getElementById('editNickname').value = currentUser.nickname;
    document.getElementById('editBio').value = currentUser.bio || '';
    document.getElementById('editOldPass').value = '';
    document.getElementById('editNewPass').value = '';
    document.getElementById('profileError').textContent = '';

    // Set selected avatar
    document.querySelectorAll('#editAvatarPicker .avatar-option').forEach(o => {
        o.classList.toggle('selected', o.dataset.avatar === currentUser.avatar);
    });
    document.getElementById('editProfileBox').style.display = 'block';
}

function cancelEditProfile() {
    document.getElementById('editProfileBox').style.display = 'none';
    document.getElementById('profileError').textContent = '';
}

function saveProfile() {
    const nickname = document.getElementById('editNickname').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    const avatar = getSelectedAvatar('editAvatarPicker');
    const oldPass = document.getElementById('editOldPass').value.trim();
    const newPass = document.getElementById('editNewPass').value.trim();
    const errEl = document.getElementById('profileError');

    const body = { uid: currentUser.uid, nickname, avatar, bio };
    if (newPass) { body.old_password = oldPass; body.new_password = newPass; }

    fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    .then(r => r.json())
    .then(data => {
        if (data.error) { errEl.textContent = data.error; return; }
        currentUser.nickname = data.nickname;
        currentUser.avatar = data.avatar;
        currentUser.bio = data.bio;
        updateProfileUI();
        cancelEditProfile();
    });
}

// ==================== TAB NAVIGATION ====================

function switchTab(tabEl) {
    const pageId = tabEl.dataset.page;
    currentTab = pageId;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById(pageId).classList.add('active-page');

    const titles = { chatListPage: 'Chats', contactsPage: 'Contacts', momentsPage: 'Moments', findingsPage: 'Findings', profilePage: 'Me' };
    document.getElementById('headerTitle').textContent = titles[pageId] || '';
    document.getElementById('headerBack').style.display = 'none';
    document.getElementById('headerRight').style.display = 'none';

    if (pageId !== 'chatViewPage') {
        document.getElementById('chatViewPage').style.display = 'none';
    }
    if (pageId === 'contactsPage') loadContacts();
    if (pageId === 'momentsPage') loadMoments();
    if (pageId === 'chatListPage') loadChatList();
    if (pageId === 'profilePage') { updateProfileUI(); loadAdminIfNeeded(); }
}

function goBack() {
    document.getElementById('headerBack').style.display = 'none';
    document.getElementById('headerTitle').textContent = 'Chats';
    document.getElementById('chatViewPage').classList.remove('active-page');
    document.getElementById('chatListPage').classList.add('active-page');
    currentTab = 'chatListPage';
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.tab[data-page="chatListPage"]').classList.add('active');
    loadChatList();
}

// ==================== PHASE 3: WEBSOCKET ====================

function connectSocket() {
    if (socket) { socket.disconnect(); }
    socket = io();
    socket.on('connect', () => {
        socket.emit('join', { uid: currentUser.uid });
    });
    socket.on('new_message', (msg) => {
        // If currently viewing this chat, append
        if (currentChatPeer && currentTab === 'chatViewPage' &&
            ((msg.from === currentChatPeer.uid && msg.to === currentUser.uid) ||
             (msg.to === currentChatPeer.uid && msg.from === currentUser.uid))) {
            appendMessage(msg);
        }
        loadChatList(); // refresh previews
    });
    socket.on('chat_history', (msgs) => {
        chatMessages = msgs;
        renderMessages(msgs);
    });
}

// ==================== PHASE 2: CONTACTS ====================

function loadContacts() {
    fetch(`/api/friends?uid=${currentUser.uid}`)
        .then(r => r.json())
        .then(data => {
            renderFriendRequests(data.received_requests, data.sent_requests);
            renderFriends(data.friends);
        });
}

function renderFriendRequests(received, sent) {
    const el = document.getElementById('friendRequests');
    let html = '';

    if (received.length) {
        received.forEach(r => {
            html += `<div class="contact-item">
                <div style="${avatarStyle(r.avatar,42)}">${getAvatarEmoji(r.avatar)}</div>
                <div class="contact-info"><strong>${esc(r.nickname)}</strong> wants to be your friend</div>
                <div class="contact-actions">
                    <button class="btn-accept" onclick="respondRequest('${r.uid}',true)">Accept</button>
                    <button class="btn-reject" onclick="respondRequest('${r.uid}',false)">Reject</button>
                </div>
            </div>`;
        });
    }

    if (sent.length) {
        sent.forEach(s => {
            html += `<div class="contact-item">
                <div style="${avatarStyle(s.avatar,42)}">${getAvatarEmoji(s.avatar)}</div>
                <div class="contact-info">Request sent to <strong>${esc(s.nickname)}</strong></div>
                <span style="color:#999;font-size:12px;">Pending</span>
            </div>`;
        });
    }

    if (!html) html = '<div style="padding:16px;color:#999;text-align:center;background:#fff;">No pending requests</div>';
    el.innerHTML = html;
}

function renderFriends(friends) {
    const el = document.getElementById('friendsList');
    if (!friends.length) {
        el.innerHTML = '<div style="padding:16px;color:#999;text-align:center;background:#fff;">No friends yet</div>';
        return;
    }
    el.innerHTML = friends.map(f => `
        <div class="contact-item" oncontextmenu="showContextMenu(event,'friend','${f.uid}','${esc(f.nickname)}')">
            <div style="${avatarStyle(f.avatar,42)};cursor:pointer;" onclick="openChat('${f.uid}','${esc(f.nickname)}','${f.avatar}')">${getAvatarEmoji(f.avatar)}</div>
            <div class="contact-info" onclick="openChat('${f.uid}','${esc(f.nickname)}','${f.avatar}')" style="cursor:pointer;">
                <strong>${esc(f.nickname)}</strong>
                ${f.bio ? '<div style="font-size:12px;color:#999;">'+esc(f.bio)+'</div>' : ''}
            </div>
            <div class="contact-actions">
                <button class="btn-remove" onclick="event.stopPropagation();removeFriend('${f.uid}')">Remove</button>
            </div>
        </div>
    `).join('');
}

function searchUsers(query) {
    if (!query) { document.getElementById('searchResults').innerHTML = ''; return; }
    fetch(`/api/users/search?q=${encodeURIComponent(query)}&uid=${currentUser.uid}`)
        .then(r => r.json())
        .then(users => {
            const el = document.getElementById('searchResults');
            if (!users.length) {
                el.innerHTML = '<div style="padding:12px;color:#999;background:#fff;">No users found</div>';
                return;
            }
            el.innerHTML = users.map(u => `
                <div class="search-result-item">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="${avatarStyle(u.avatar,36)}">${getAvatarEmoji(u.avatar)}</div>
                        <div>
                            <strong>${esc(u.nickname)}</strong>
                            <div style="font-size:12px;color:#999;">@${esc(u.username)}</div>
                        </div>
                    </div>
                    <button class="add-btn" onclick="sendRequest('${u.uid}')">Add</button>
                </div>
            `).join('');
        });
}

function sendRequest(toUid) {
    fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: currentUser.uid, to: toUid })
    })
    .then(r => r.json())
    .then(data => {
        if (data.error) { alert(data.error); return; }
        loadContacts();
        document.getElementById('contactSearch').value = '';
        document.getElementById('searchResults').innerHTML = '<div style="padding:12px;color:var(--wechat-green);background:#fff;">Friend request sent!</div>';
    });
}

function respondRequest(fromUid, accept) {
    fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: currentUser.uid, from: fromUid, accept })
    })
    .then(() => { loadContacts(); loadChatList(); });
}

function removeFriend(friendUid) {
    if (!confirm('Remove this friend?')) return;
    fetch('/api/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: currentUser.uid, friend_uid: friendUid })
    })
    .then(() => { loadContacts(); loadChatList(); });
}

// ==================== PHASE 3: CHAT ====================

function loadChatList() {
    fetch(`/api/friends?uid=${currentUser.uid}`)
        .then(r => r.json())
        .then(data => {
            const msgs = [];
            // We'll use the friends list and last message info
            renderChatListFromFriends(data.friends);
        });
}

function renderChatListFromFriends(friends) {
    const el = document.getElementById('chatList');
    if (!friends.length) {
        el.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">No chats yet. Go to Contacts to add friends!</div>';
        return;
    }
    // Fetch messages to get last preview
    fetch(`/api/messages?uid=${currentUser.uid}&after=0`)
        .then(r => r.json())
        .then(msgs => {
            const lastMsgs = {};
            msgs.forEach(m => {
                const peer = m.from === currentUser.uid ? m.to : m.from;
                if (!lastMsgs[peer] || m.time > lastMsgs[peer].time) lastMsgs[peer] = m;
            });

            el.innerHTML = friends.map(f => {
                const lm = lastMsgs[f.uid];
                let preview = lm ? ((lm.from === currentUser.uid ? 'You: ' : '') + (lm.text || '[Photo]')) : 'No messages yet';
                const time = lm ? formatTime(lm.time) : '';
                return `
                    <div class="chat-item" onclick="openChat('${f.uid}', '${esc(f.nickname)}', '${f.avatar}')" oncontextmenu="showContextMenu(event,'chat','${f.uid}','${esc(f.nickname)}')">
                        <div style="${avatarStyle(f.avatar,48)}">${getAvatarEmoji(f.avatar)}</div>
                        <div class="chat-info">
                            <div class="chat-name">${esc(f.nickname)}</div>
                            <div class="chat-preview">${esc(preview)}</div>
                        </div>
                        <div class="chat-meta"><div class="chat-time">${time}</div></div>
                    </div>`;
            }).join('') || '<div style="text-align:center;padding:40px;color:#999;">No chats yet.</div>';
        });
}

function openChat(uid, nickname, avatar) {
    currentChatPeer = { uid, nickname, avatar };
    currentTab = 'chatViewPage';
    document.getElementById('headerTitle').textContent = nickname;
    document.getElementById('headerBack').style.display = 'block';
    document.getElementById('chatListPage').classList.remove('active-page');
    document.getElementById('chatViewPage').classList.add('active-page');
    document.getElementById('chatViewPage').style.display = 'flex';
    document.getElementById('chatViewPage').style.flexDirection = 'column';
    document.getElementById('chatInput').value = '';

    // Request chat history via socket
    if (socket && socket.connected) {
        socket.emit('get_history', { uid: currentUser.uid, peer: uid });
    }
}

function renderMessages(msgs) {
    const el = document.getElementById('chatMessages');
    let html = '';
    msgs.forEach(m => {
        const isMine = m.from === currentUser.uid;
        const senderName = !isMine ? `<div class="msg-sender">${currentChatPeer ? esc(currentChatPeer.nickname) : ''}</div>` : '';
        let content = '';
        if (m.text) content += esc(m.text);
        if (m.image) content += `<br><img src="${esc(m.image)}" class="msg-image" onclick="window.open('${esc(m.image)}')" loading="lazy">`;
        html += `
            <div class="msg-row ${isMine ? 'msg-mine' : 'msg-theirs'}">
                <div>${senderName}<div class="msg-bubble">${content}</div>
                <div style="font-size:10px;color:#bbb;margin-top:2px;">${formatTime(m.time)}</div></div>
            </div>`;
    });
    el.innerHTML = html || '<div style="text-align:center;padding:40px;color:#999;">No messages yet. Say hello!</div>';
    el.scrollTop = el.scrollHeight;
}

function appendMessage(m) {
    chatMessages.push(m);
    renderMessages(chatMessages);
}

function sendMessage() {
    const text = document.getElementById('chatInput').value.trim();
    if (!text || !socket || !currentChatPeer) return;

    socket.emit('private_message', {
        from: currentUser.uid,
        to: currentChatPeer.uid,
        text
    });
    document.getElementById('chatInput').value = '';
    // Optimistically append
    const msg = {
        id: Date.now().toString(),
        from: currentUser.uid,
        to: currentChatPeer.uid,
        text,
        image: '',
        time: Date.now() / 1000
    };
    appendMessage(msg);
}

function sendImageMessage() {
    const fileInput = document.getElementById('chatImageInput');
    const file = fileInput.files[0];
    if (!file || !socket || !currentChatPeer) { fileInput.value = ''; return; }

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/upload', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            if (data.error) { alert(data.error); fileInput.value = ''; return; }
            const imageUrl = data.url;
            socket.emit('private_message', {
                from: currentUser.uid,
                to: currentChatPeer.uid,
                text: '',
                image: imageUrl
            });
            const msg = {
                id: Date.now().toString(),
                from: currentUser.uid,
                to: currentChatPeer.uid,
                text: '',
                image: imageUrl,
                time: Date.now() / 1000
            };
            appendMessage(msg);
            fileInput.value = '';
        })
        .catch(err => { alert('Upload failed'); fileInput.value = ''; });
}

// ==================== PHASE 4: MOMENTS ====================

function loadMoments() {
    fetch(`/api/moments?uid=${currentUser.uid}`)
        .then(r => r.json())
        .then(moments => {
            const el = document.getElementById('momentsFeed');
            if (!moments.length) {
                el.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">No moments yet. Be the first to share!</div>';
                return;
            }
            el.innerHTML = moments.map(m => `
                <div class="moment-item">
                    <div class="moment-header">
                        <div style="${avatarCircleStyle(m.avatar,40)}">${getAvatarEmoji(m.avatar)}</div>
                        <span class="moment-nickname">${esc(m.nickname)}</span>
                        <span class="moment-time">${formatTime(m.time)}</span>
                        ${m.user === currentUser.uid ? `<span class="moment-delete" onclick="deleteMoment('${m.id}')">Delete</span>` : ''}
                    </div>
                    <div class="moment-text">${esc(m.text)}</div>
                    ${m.image ? `<div class="moment-image"><img src="${esc(m.image)}" alt="" onerror="this.style.display='none'" loading="lazy"></div>` : ''}
                    <div class="moment-actions">
                        <span class="${m.liked ? 'liked' : ''}" onclick="toggleLike('${m.id}')">Like (${m.likes.length})</span>
                        <span onclick="focusComment('${m.id}')">Comment (${m.comments.length})</span>
                    </div>
                    ${m.comments.length ? `<div class="moment-comments">
                        ${m.comments.map(c => `<div class="moment-comment"><span class="comment-user">${esc(c.nickname)}:</span>${esc(c.text)}</div>`).join('')}
                    </div>` : ''}
                    <div class="comment-input-row">
                        <input type="text" id="commentInput-${m.id}" placeholder="Add a comment...">
                        <button onclick="postComment('${m.id}')">Send</button>
                    </div>
                </div>
            `).join('');
        });
}

function showPostMoment() {
    const box = document.getElementById('postMomentBox');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
    if (box.style.display === 'none') clearMomentImage();
}

function postMoment() {
    const text = document.getElementById('momentText').value.trim();
    if (!text && !momentImageFile) return;

    function doPost(imageUrl) {
        fetch('/api/moments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: currentUser.uid, text, image: imageUrl || '' })
        })
        .then(() => {
            document.getElementById('momentText').value = '';
            clearMomentImage();
            document.getElementById('postMomentBox').style.display = 'none';
            loadMoments();
        });
    }

    if (momentImageFile) {
        const formData = new FormData();
        formData.append('file', momentImageFile);
        fetch('/api/upload', { method: 'POST', body: formData })
            .then(r => r.json())
            .then(data => {
                if (data.error) { alert(data.error); return; }
                doPost(data.url);
            })
            .catch(() => { alert('Upload failed'); });
    } else {
        doPost('');
    }
}

let momentImageFile = null;

function previewMomentImage() {
    const file = document.getElementById('momentImageInput').files[0];
    if (!file) return;
    momentImageFile = file;
    document.getElementById('momentImagePreview').textContent = file.name;
    document.getElementById('momentImageClear').style.display = 'inline';
}

function clearMomentImage() {
    momentImageFile = null;
    document.getElementById('momentImageInput').value = '';
    document.getElementById('momentImagePreview').textContent = '';
    document.getElementById('momentImageClear').style.display = 'none';
}

function toggleLike(mid) {
    fetch(`/api/moments/${mid}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: currentUser.uid })
    }).then(() => loadMoments());
}

function focusComment(mid) {
    const inp = document.getElementById('commentInput-' + mid);
    if (inp) inp.focus();
}

function postComment(mid) {
    const inp = document.getElementById('commentInput-' + mid);
    const text = inp.value.trim();
    if (!text) return;
    fetch(`/api/moments/${mid}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: currentUser.uid, text })
    }).then(() => { loadMoments(); });
}

// ==================== PHASE 5: ADMIN ====================

function loadAdminIfNeeded() {
    if (currentUser.role !== 'admin') return;
    loadAdminStats();
    loadAdminUsers();
    loadAdminMoments();
}

function loadAdminStats() {
    fetch('/api/admin/stats')
        .then(r => r.json())
        .then(stats => {
            document.getElementById('adminStats').innerHTML = `
                <div class="stat-card"><div class="stat-num">${stats.total_users}</div><div class="stat-label">Users</div></div>
                <div class="stat-card"><div class="stat-num">${stats.total_moments}</div><div class="stat-label">Moments</div></div>
                <div class="stat-card"><div class="stat-num">${stats.total_messages}</div><div class="stat-label">Messages</div></div>
                <div class="stat-card"><div class="stat-num">${stats.total_friendships}</div><div class="stat-label">Friendships</div></div>
            `;
        });
}

function loadAdminUsers() {
    fetch('/api/admin/users')
        .then(r => r.json())
        .then(users => {
            document.getElementById('adminUserList').innerHTML = users.map(u => `
                <div class="admin-list-item">
                    <div>
                        <strong>${esc(u.nickname)}</strong> (@${esc(u.username)})
                        <span style="font-size:11px;color:#999;">${u.role}</span>
                    </div>
                    ${u.role !== 'admin' ? `<button class="btn-delete" onclick="deleteUser('${u.uid}')">Delete</button>` : ''}
                </div>
            `).join('');
        });
}

function loadAdminMoments() {
    fetch('/api/moments?uid=' + currentUser.uid)
        .then(r => r.json())
        .then(moments => {
            document.getElementById('adminMomentList').innerHTML = moments.map(m => `
                <div class="admin-list-item">
                    <div style="flex:1;">
                        <strong>${esc(m.nickname)}</strong>:
                        <span style="font-size:13px;">${esc(m.text).substring(0, 40)}${m.text.length > 40 ? '...' : ''}</span>
                    </div>
                    <button class="btn-delete" onclick="deleteMoment('${m.id}')">Delete</button>
                </div>
            `).join('') || '<div style="padding:12px;color:#999;background:#fff;">No moments</div>';
        });
}

function deleteUser(uid) {
    if (!confirm('Delete this user permanently?')) return;
    fetch(`/api/admin/users/${uid}`, { method: 'DELETE' })
        .then(() => loadAdminUsers());
}

function deleteMoment(mid) {
    if (!confirm('Delete this moment?')) return;
    fetch(`/api/admin/moments/${mid}`, { method: 'DELETE' })
        .then(() => loadAdminMoments());
}

// ==================== UTILS ====================

function filterChats(query) {
    document.querySelectorAll('#chatList .chat-item').forEach(item => {
        const name = item.querySelector('.chat-name');
        item.style.display = name && name.textContent.toLowerCase().includes(query.toLowerCase()) ? 'flex' : 'none';
    });
}

function headerAction() {
    // Optional: can be used for creating new groups etc.
}

function formatTime(ts) {
    const d = new Date(ts * 1000);
    const now = new Date();
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    if (d.toDateString() === now.toDateString()) return h + ':' + m;
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + h + ':' + m;
}

function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========= Context Menu =========
let contextTarget = null; // { type: 'chat'|'friend', uid, nickname }

function showContextMenu(e, type, uid, nickname) {
    e.preventDefault();
    contextTarget = { type, uid, nickname };
    const menu = document.getElementById('contextMenu');
    menu.style.display = 'block';
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
}

function hideContextMenu(e) {
    // Don't hide if clicking inside the context menu itself
    if (e && e.target.closest('#contextMenu')) return;
    document.getElementById('contextMenu').style.display = 'none';
    contextTarget = null;
}

function contextAction(action) {
    if (!contextTarget) return;
    const target = contextTarget;
    hideContextMenu();
    if (action === 'delete') {
        if (target.type === 'chat') {
            if (confirm(`Delete chat with ${target.nickname}?`)) {
                deleteChat(target.uid);
            }
        } else if (target.type === 'friend') {
            removeFriend(target.uid);
        }
    }
}

function deleteChat(uid) {
    fetch(`/api/chats/${uid}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'ok') {
                // Refresh chat list
                loadChatList();
                // If currently viewing this chat, go back
                if (currentChatPeer && currentChatPeer.uid === uid) {
                    backToChatList();
                }
            }
        });
}

// Hide context menu on click anywhere
document.addEventListener('click', hideContextMenu);

function deleteMoment(mid) {
    if (!confirm('Delete this moment?')) return;
    fetch(`/api/moments/${mid}?uid=${currentUser.uid}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'ok') loadMoments();
            else alert(data.error || 'Failed to delete');
        });
}

// ==================== SNAKE GAME (Findings) ====================
let snakeState = null;

function startSnakeGame() {
    const canvas = document.getElementById('snakeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const gridSize = 17;
    const cellSize = canvas.width / gridSize;

    let snake = [{x: 8, y: 8}];
    let dir = {x: 1, y: 0};
    let nextDir = {x: 1, y: 0};
    let apple = randomApple(snake, gridSize);
    let score = 0;
    let gameOver = false;
    let gameLoop = null;

    function randomApple(s, gs) {
        const all = [];
        for (let x = 0; x < gs; x++) for (let y = 0; y < gs; y++) {
            if (!s.some(p => p.x === x && p.y === y)) all.push({x, y});
        }
        return all[Math.floor(Math.random() * all.length)];
    }

    function draw() {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Apple
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(apple.x * cellSize + cellSize/2, apple.y * cellSize + cellSize/2, cellSize/2 - 2, 0, Math.PI*2);
        ctx.fill();
        // Snake
        snake.forEach((p, i) => {
            ctx.fillStyle = i === 0 ? '#07C160' : '#06a050';
            ctx.fillRect(p.x * cellSize + 2, p.y * cellSize + 2, cellSize - 4, cellSize - 4);
        });
        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
            ctx.font = '12px sans-serif';
            ctx.fillText('Click START GAME to retry', canvas.width/2, canvas.height/2 + 24);
            ctx.textAlign = 'start';
        }
    }

    function step() {
        if (gameOver) return;
        dir = nextDir;
        const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
        // Wall collision
        if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
            gameOver = true; clearInterval(gameLoop); draw(); return;
        }
        // Self collision
        if (snake.some(p => p.x === head.x && p.y === head.y)) {
            gameOver = true; clearInterval(gameLoop); draw(); return;
        }
        snake.unshift(head);
        if (head.x === apple.x && head.y === apple.y) {
            score++;
            document.getElementById('snakeScore').textContent = score;
            apple = randomApple(snake, gridSize);
        } else {
            snake.pop();
        }
        draw();
    }

    // Clean up any previous game
    if (snakeState && snakeState.loop) clearInterval(snakeState.loop);
    document.removeEventListener('keydown', snakeState ? snakeState.kb : null);
    // Also clean up pong game if running
    if (pongState && pongState.loop) clearInterval(pongState.loop);
    document.removeEventListener('keydown', pongState ? pongState.kb : null);

    function kb(e) {
        if (gameOver) return;
        const k = e.key.toLowerCase();
        if ((k === 'arrowup' || k === 'w') && dir.y === 0) nextDir = {x: 0, y: -1};
        if ((k === 'arrowdown' || k === 's') && dir.y === 0) nextDir = {x: 0, y: 1};
        if ((k === 'arrowleft' || k === 'a') && dir.x === 0) nextDir = {x: -1, y: 0};
        if ((k === 'arrowright' || k === 'd') && dir.x === 0) nextDir = {x: 1, y: 0};
    }

    document.addEventListener('keydown', kb);
    gameLoop = setInterval(step, 120);
    document.getElementById('snakeScore').textContent = '0';
    draw();

    snakeState = { loop: gameLoop, kb: kb };
}

// ==================== PONG GAME (Findings) ====================
let pongState = null;

function startPongGame() {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const padW = 8, padH = 60;

    let playerY = H / 2 - padH / 2;
    let cpuY = H / 2 - padH / 2;
    let balls = [{ x: W / 2, y: H / 2, vx: 4, vy: 3 }];
    let playerScore = 0, cpuScore = 0;
    let gameOver = false;
    let gameLoop = null;
    let buff = null; // { x, y, type: 'speed'|'freeze'|'split' }
    let buffTimer = 0;
    let freezeTimer = 0;

    function resetBall() {
        balls = [{ x: W / 2, y: H / 2, vx: (Math.random() > 0.5 ? 4 : -4), vy: (Math.random() * 5 - 2.5) }];
        freezeTimer = 0; buff = null; buffTimer = 0;
    }

    function spawnBuff() {
        const types = ['speed', 'freeze', 'split'];
        buff = { x: W * 0.2 + Math.random() * W * 0.6, y: H * 0.2 + Math.random() * H * 0.6, type: types[Math.floor(Math.random() * 3)] };
    }

    function activateBuff(type) {
        if (type === 'speed') {
            balls.forEach(b => { b.vx *= 1.6; b.vy *= 1.6; });
        } else if (type === 'freeze') {
            freezeTimer = 180;
        } else if (type === 'split') {
            const nb = [];
            balls.forEach(b => {
                for (let i = 0; i < 5; i++) {
                    const ang = Math.atan2(b.vy, b.vx) + (Math.PI / 8) * (i - 2);
                    const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                    nb.push({ x: b.x, y: b.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp });
                }
            });
            balls = nb;
        }
    }

    function draw() {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, W, H);
        ctx.setLineDash([8, 8]); ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
        ctx.setLineDash([]);
        // Buff
        if (buff) {
            const bc = { speed: '#ff0', freeze: '#0ff', split: '#f0f' };
            const bl = { speed: 'S', freeze: 'F', split: 'X' };
            ctx.fillStyle = bc[buff.type]; ctx.fillRect(buff.x - 10, buff.y - 10, 20, 20);
            ctx.fillStyle = '#000'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
            ctx.fillText(bl[buff.type], buff.x, buff.y + 5); ctx.textAlign = 'start';
        }
        // Paddles
        ctx.fillStyle = '#07C160'; ctx.fillRect(0, playerY, padW, padH);
        ctx.fillStyle = freezeTimer > 0 ? '#666' : '#e74c3c'; ctx.fillRect(W - padW, cpuY, padW, padH);
        // Balls
        ctx.fillStyle = '#fff';
        balls.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill(); });
        // Scores
        ctx.fillStyle = '#07C160'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center';
        ctx.fillText(playerScore, W / 4, 30);
        ctx.fillStyle = '#e74c3c'; ctx.fillText(cpuScore, W * 3 / 4, 30); ctx.textAlign = 'start';
        if (freezeTimer > 0) {
            ctx.fillStyle = '#0ff'; ctx.font = '11px sans-serif';
            ctx.fillText('FROZEN ' + Math.ceil(freezeTimer / 60) + 's', W - 110, 20);
        }
        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(playerScore >= 7 ? 'YOU WIN!' : 'CPU WINS!', W / 2, H / 2);
            ctx.font = '12px sans-serif'; ctx.fillText('Click START PONG to retry', W / 2, H / 2 + 24); ctx.textAlign = 'start';
        }
    }

    function update() {
        if (gameOver) return;
        if (keys.up) playerY = Math.max(0, playerY - 5);
        if (keys.down) playerY = Math.min(H - padH, playerY + 5);
        buffTimer++;
        if (buffTimer >= 300) { buffTimer = 0; if (!buff) spawnBuff(); }
        if (freezeTimer > 0) freezeTimer--;
        for (let bi = balls.length - 1; bi >= 0; bi--) {
            const b = balls[bi];
            b.x += b.vx; b.y += b.vy;
            if (b.y <= 6 || b.y >= H - 6) b.vy *= -1;
            if (buff && b.x > buff.x - 16 && b.x < buff.x + 16 && b.y > buff.y - 16 && b.y < buff.y + 16) {
                activateBuff(buff.type); buff = null; buffTimer = 0;
            }
            if (b.x <= padW && b.y >= playerY && b.y <= playerY + padH) {
                b.vx = Math.abs(b.vx) * 1.05; b.vy += (b.y - (playerY + padH / 2)) * 0.15;
            }
            if (b.x >= W - padW - 6 && b.y >= cpuY && b.y <= cpuY + padH) {
                b.vx = -Math.abs(b.vx) * 1.05; b.vy += (b.y - (cpuY + padH / 2)) * 0.15;
            }
            if (b.x < 0) { cpuScore++; checkWin(); balls = balls.filter((_, i) => i !== bi); }
            if (b.x > W) { playerScore++; checkWin(); balls = balls.filter((_, i) => i !== bi); }
        }
        if (balls.length === 0 && !gameOver) resetBall();
        if (freezeTimer <= 0) {
            let tgt = null;
            for (const b of balls) { if (b.vx > 0 && (!tgt || b.x > tgt.x)) tgt = b; }
            if (tgt) {
                const cc = cpuY + padH / 2;
                if (cc < tgt.y - 10) cpuY += 3.5;
                if (cc > tgt.y + 10) cpuY -= 3.5;
            }
            cpuY = Math.max(0, Math.min(H - padH, cpuY));
        }
        draw();
    }

    function checkWin() {
        document.getElementById('pongPlayer').textContent = playerScore;
        document.getElementById('pongCpu').textContent = cpuScore;
        if (playerScore >= 7 || cpuScore >= 7) {
            gameOver = true; clearInterval(gameLoop); draw();
        } else { resetBall(); }
    }

    let keys = { up: false, down: false };
    function kbDown(e) {
        const k = e.key.toLowerCase();
        if (k === 'arrowup' || k === 'w') { keys.up = true; e.preventDefault(); }
        if (k === 'arrowdown' || k === 's') { keys.down = true; e.preventDefault(); }
    }
    function kbUp(e) {
        const k = e.key.toLowerCase();
        if (k === 'arrowup' || k === 'w') keys.up = false;
        if (k === 'arrowdown' || k === 's') keys.down = false;
    }

    if (pongState && pongState.loop) clearInterval(pongState.loop);
    document.removeEventListener('keydown', pongState ? pongState.down : null);
    document.removeEventListener('keyup', pongState ? pongState.up : null);
    if (snakeState && snakeState.loop) clearInterval(snakeState.loop);
    document.removeEventListener('keydown', snakeState ? snakeState.kb : null);

    document.addEventListener('keydown', kbDown);
    document.addEventListener('keyup', kbUp);
    playerY = H / 2 - padH / 2; cpuY = H / 2 - padH / 2;
    playerScore = 0; cpuScore = 0; gameOver = false;
    document.getElementById('pongPlayer').textContent = '0';
    document.getElementById('pongCpu').textContent = '0';
    resetBall();
    gameLoop = setInterval(update, 20);
    draw();
    pongState = { loop: gameLoop, down: kbDown, up: kbUp };
}
