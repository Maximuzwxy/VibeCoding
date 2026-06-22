const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI0U1RTdFQiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOUNBM0FGIi8+PGVsbGlwc2UgY3g9IjUwIiBjeT0iNzUiIHJ4PSIyNSIgcnk9IjIwIiBmaWxsPSIjOUNBM0FGIi8+PC9zdmc+';
let socket = null;
let unreadMessages = new Set();

function updateChatItemDots() {
    document.querySelectorAll('.chat-item').forEach(item => {
        const username = item.dataset.username;
        const dot = item.querySelector('.chat-item-dot');
        if (dot) {
            if (unreadMessages.has(username)) {
                dot.classList.remove('hidden');
            } else {
                dot.classList.add('hidden');
            }
        }
    });
}

function getAvatarUrl(avatar) {
    return avatar || DEFAULT_AVATAR;
}

function initSocket() {
    if (socket) return;
    socket = io();
    
    socket.on('new_message', (msg) => {
        const otherUser = msg.from === currentUser.username ? msg.to : msg.from;
        
        if (currentChatUsername && otherUser === currentChatUsername) {
            appendMessage(msg);
        } else {
            unreadMessages.add(otherUser);
            updateAllDots();
        }
        loadConversations();
    });
    
    socket.on('error', (data) => {
        showToast(data.message, 'error');
    });
}

function updateAllDots() {
    updateNavDot();
    updateChatItemDots();
}

function updateNavDot() {
    const navDot = document.getElementById('navChatDot');
    if (!navDot) return;
    
    const isOnChatPage = document.getElementById('chatList') !== null;
    
    if (isOnChatPage) {
        navDot.style.display = 'none';
    } else {
        navDot.style.display = unreadMessages.size > 0 ? 'inline-block' : 'none';
    }
}

function getAvatarUrl(avatar) {
    return avatar || DEFAULT_AVATAR;
}

function avatarOnError(img) {
    img.onerror = null;
    img.src = DEFAULT_AVATAR;
}

function showToast(message, type = 'default') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast';
    if (type === 'success') toast.classList.add('success');
    if (type === 'error') toast.classList.add('error');
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await API.get('/api/auth/me');
        currentUser = response.user;
    } catch (error) {
        window.location.href = '/login';
        return;
    }
    
    updateSidebar();
    initSocket();
    
    if (document.getElementById('friendsList')) {
        try {
            initContactsPage();
        } catch (e) {
            console.error('Contacts page init error:', e);
        }
    }
    
    if (document.getElementById('settingsBio')) {
        try {
            initSettingsPage();
        } catch (e) {
            console.error('Settings page init error:', e);
        }
    }
    
    if (document.getElementById('chatList')) {
        try {
            initChatPage();
        } catch (e) {
            console.error('Chat page init error:', e);
        }
    }
    
    if (document.getElementById('postsList')) {
        try {
            initFriendsCirclePage();
        } catch (e) {
            console.error('Friends circle page init error:', e);
        }
    }
});

function updateSidebar() {
    if (!currentUser) return;
    
    const avatar = document.getElementById('sidebarAvatar');
    const username = document.getElementById('sidebarUsername');
    if (avatar) {
        avatar.src = getAvatarUrl(currentUser.avatar);
        avatar.onerror = function() { avatarOnError(this); };
    }
    if (username) username.textContent = currentUser.username;
}

function initContactsPage() {
    loadFriends();
    loadFriendRequests();
    setupSearch();
}

async function loadFriends() {
    const container = document.getElementById('friendsList');
    if (!container) return;
    
    try {
        const response = await API.getFriends();
        const friends = response.friends;
        
        if (friends.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="1.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <p>还没有好友</p>
                    <p class="empty-hint">搜索用户并发送好友请求</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = friends.map(friend => `
            <div class="friend-item" data-username="${friend.username}">
                <img class="user-avatar-small" src="${getAvatarUrl(friend.avatar)}" alt="${friend.username}" onerror="avatarOnError(this)">
                <div class="friend-info">
                    <div class="username">${friend.username}</div>
                    <div class="bio">${friend.bio || '这个人很懒，什么都没写'}</div>
                </div>
                <div class="friend-actions">
                    <button class="btn btn-primary btn-sm btn-chat-friend" data-username="${friend.username}">聊天</button>
                    <button class="btn btn-secondary btn-sm btn-profile-friend" data-username="${friend.username}">主页</button>
                    <button class="btn btn-danger btn-sm btn-remove-friend" data-username="${friend.username}">删除</button>
                </div>
            </div>
        `).join('');
        
        container.querySelectorAll('.btn-chat-friend').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = e.target.dataset.username;
                window.location.href = '/chat';
                sessionStorage.setItem('chatTarget', username);
            });
        });
        
        container.querySelectorAll('.btn-remove-friend').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const username = e.target.dataset.username;
                if (confirm(`确定要删除好友 ${username} 吗？`)) {
                    try {
                        await API.removeFriend(username);
                        showToast('好友已删除', 'success');
                        loadFriends();
                    } catch (error) {
                        showToast(error.message, 'error');
                    }
                }
            });
        });

        container.querySelectorAll('.btn-profile-friend').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = e.target.dataset.username;
                window.location.href = `/profile/${username}`;
            });
        });
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><p>加载失败：${error.message}</p></div>`;
    }
}

async function loadFriendRequests() {
    const section = document.getElementById('friendRequestsSection');
    const list = document.getElementById('friendRequestsList');
    const badge = document.getElementById('requestBadge');
    
    if (!section) return;
    
    try {
        const response = await API.getFriendRequests();
        const requests = response.requests;
        
        if (requests.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        badge.textContent = requests.length;
        badge.style.display = 'inline';
        
        list.innerHTML = requests.map(req => `
            <div class="friend-request-item" data-id="${req.id}">
                <img class="user-avatar-small" src="${getAvatarUrl(req.from.avatar)}" alt="${req.from.username}" onerror="avatarOnError(this)">
                <div class="friend-request-info">
                    <div class="username">${req.from.username}</div>
                </div>
                <div class="friend-request-actions">
                    <button class="btn btn-sm btn-accept" data-id="${req.id}" data-action="accept">接受</button>
                    <button class="btn btn-sm btn-reject" data-id="${req.id}" data-action="reject">拒绝</button>
                </div>
            </div>
        `).join('');
        
        list.querySelectorAll('.btn-accept, .btn-reject').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const action = e.target.dataset.action;
                try {
                    await API.handleFriendRequest(id, action);
                    showToast(action === 'accept' ? '已接受好友请求' : '已拒绝好友请求', 'success');
                    loadFriendRequests();
                    loadFriends();
                } catch (error) {
                    showToast(error.message, 'error');
                }
            });
        });
    } catch (error) {
        section.style.display = 'none';
    }
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    let searchTimeout;
    const friendsList = document.getElementById('friendsList');
    const friendRequestsSection = document.getElementById('friendRequestsSection');
    const searchResults = document.getElementById('searchResults');
    
    searchInput.addEventListener('focus', () => {
        if (friendsList) friendsList.style.display = 'none';
        if (friendRequestsSection) friendRequestsSection.style.display = 'none';
    });
    
    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            const query = searchInput.value.trim();
            if (query.length === 0) {
                if (friendsList) friendsList.style.display = '';
                if (friendRequestsSection) {
                    const hasRequests = friendRequestsSection.querySelector('.friend-request-item');
                    friendRequestsSection.style.display = hasRequests ? 'block' : 'none';
                }
                if (searchResults) searchResults.style.display = 'none';
            }
        }, 200);
    });
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length === 0) {
            if (searchResults) searchResults.style.display = 'none';
            if (friendsList) friendsList.style.display = '';
            if (friendRequestsSection) {
                const hasRequests = friendRequestsSection.querySelector('.friend-request-item');
                friendRequestsSection.style.display = hasRequests ? 'block' : 'none';
            }
            return;
        }
        
        if (friendsList) friendsList.style.display = 'none';
        if (friendRequestsSection) friendRequestsSection.style.display = 'none';
        
        searchTimeout = setTimeout(async () => {
            try {
                const response = await API.searchUsers(query);
                displaySearchResults(response.users);
            } catch (error) {
                showToast(error.message, 'error');
            }
        }, 300);
    });
}

function displaySearchResults(users) {
    const container = document.getElementById('searchResults');
    const list = document.getElementById('searchResultsList');
    
    if (users.length === 0) {
        container.style.display = 'block';
        list.innerHTML = '<div class="empty-state"><p>没有找到用户</p></div>';
        return;
    }
    
    container.style.display = 'block';
    list.innerHTML = users.map(user => {
        let btnHtml = '';
        if (user.friend_status === 'accepted') {
            btnHtml = `<button class="btn btn-secondary btn-sm btn-profile-search" data-username="${user.username}">主页</button>
                       <button class="btn btn-danger btn-sm btn-remove-search-friend" data-username="${user.username}">删除</button>`;
        } else if (user.friend_status === 'pending') {
            btnHtml = `<button class="btn btn-secondary btn-sm btn-profile-search" data-username="${user.username}">主页</button>`;
        } else {
            btnHtml = `<button class="btn btn-secondary btn-sm btn-profile-search" data-username="${user.username}">主页</button>
                       <button class="btn btn-primary btn-sm btn-add-friend" data-username="${user.username}">添加好友</button>`;
        }
        return `
            <div class="search-result-item" data-username="${user.username}">
                <img class="user-avatar-small" src="${getAvatarUrl(user.avatar)}" alt="${user.username}" onerror="avatarOnError(this)">
                <div class="search-result-info">
                    <div class="username">${user.username}</div>
                </div>
                ${btnHtml}
            </div>
        `;
    }).join('');
    
    list.querySelectorAll('.btn-add-friend').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const username = e.target.dataset.username;
            try {
                await API.sendFriendRequest(username);
                showToast('好友请求已发送', 'success');
                e.target.textContent = '已发送';
                e.target.disabled = true;
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    });

    list.querySelectorAll('.btn-profile-search').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const username = e.target.dataset.username;
            window.location.href = `/profile/${username}`;
        });
    });

    list.querySelectorAll('.btn-remove-search-friend').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const username = e.target.dataset.username;
            if (confirm(`确定要删除好友 ${username} 吗？`)) {
                try {
                    await API.removeFriend(username);
                    showToast('好友已删除', 'success');
                    searchInput.value = '';
                    searchInput.dispatchEvent(new Event('input'));
                } catch (error) {
                    showToast(error.message, 'error');
                }
            }
        });
    });
}

function initSettingsPage() {
    const avatar = document.getElementById('settingsAvatar');
    const username = document.getElementById('profileUsername');
    const bio = document.getElementById('settingsBio');
    const profileBio = document.getElementById('profileBio');
    const charCount = document.getElementById('bioCharCount');
    
    if (avatar) {
        avatar.src = getAvatarUrl(currentUser.avatar);
        avatar.onerror = function() { avatarOnError(this); };
    }
    if (username) username.textContent = currentUser.username;
    if (profileBio) profileBio.textContent = currentUser.bio || '还没有个人简介';
    if (bio) {
        bio.value = currentUser.bio || '';
        charCount.textContent = bio.value.length;
    }
    
    const bioInput = document.getElementById('settingsBio');
    if (bioInput) {
        bioInput.addEventListener('input', () => {
            document.getElementById('bioCharCount').textContent = bioInput.value.length;
        });
    }
    
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async () => {
            const bio = document.getElementById('settingsBio').value.trim();
            try {
                await API.updateProfile({ bio });
                currentUser.bio = bio;
                document.getElementById('profileBio').textContent = bio || '还没有个人简介';
                showToast('资料保存成功', 'success');
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }
    
    const avatarInput = document.getElementById('avatarInput');
    let pendingAvatarFile = null;
    let pendingAvatarPreview = null;
    
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (!file.type.startsWith('image/')) {
                showToast('请选择图片文件', 'error');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                showToast('图片大小不能超过5MB', 'error');
                return;
            }
            
            pendingAvatarFile = file;
            const reader = new FileReader();
            reader.onload = (ev) => {
                pendingAvatarPreview = ev.target.result;
                document.getElementById('avatarPreview').src = pendingAvatarPreview;
                document.getElementById('avatarPreviewSection').style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }
    
    const cancelAvatarBtn = document.getElementById('cancelAvatarBtn');
    if (cancelAvatarBtn) {
        cancelAvatarBtn.addEventListener('click', () => {
            document.getElementById('avatarPreviewSection').style.display = 'none';
            pendingAvatarFile = null;
            pendingAvatarPreview = null;
            avatarInput.value = '';
        });
    }
    
    const confirmAvatarBtn = document.getElementById('confirmAvatarBtn');
    if (confirmAvatarBtn) {
        confirmAvatarBtn.addEventListener('click', async () => {
            if (!pendingAvatarFile) return;
            
            try {
                const response = await API.uploadAvatar(pendingAvatarFile);
                currentUser.avatar = response.user.avatar;
                updateSidebar();
                document.getElementById('settingsAvatar').src = getAvatarUrl(currentUser.avatar);
                document.getElementById('settingsAvatar').onerror = function() { avatarOnError(this); };
                document.getElementById('avatarPreviewSection').style.display = 'none';
                pendingAvatarFile = null;
                pendingAvatarPreview = null;
                avatarInput.value = '';
                showToast('头像上传成功', 'success');
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }
    
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', async () => {
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;
            
            if (!currentPassword || !newPassword || !confirmNewPassword) {
                showToast('请填写所有密码字段', 'error');
                return;
            }
            
            try {
                await API.updatePassword(currentPassword, newPassword, confirmNewPassword);
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmNewPassword').value = '';
                showToast('密码修改成功', 'success');
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('确定要退出登录吗？')) {
                await API.post('/api/auth/logout', {});
                window.location.href = '/login';
            }
        });
    }
}

function initFriendsCirclePage() {
    // This function is called from app.js after currentUser is set
    // The actual initialization is handled in friendscircle.html's script
}

let conversationsCache = [];
let currentChatUsername = null;

function initChatPage() {
    loadConversations();
    
    const chatTarget = sessionStorage.getItem('chatTarget');
    if (chatTarget) {
        sessionStorage.removeItem('chatTarget');
        setTimeout(() => {
            const item = document.querySelector(`.chat-item[data-username="${chatTarget}"]`);
            if (item) {
                item.click();
            } else {
                openChat(chatTarget);
            }
        }, 500);
    }
    
    const chatSearch = document.getElementById('chatSearchInput');
    if (chatSearch) {
        chatSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = conversationsCache.filter(c => c.username.toLowerCase().includes(query));
            renderChatList(filtered);
        });
    }
    
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    const sendBtn = document.getElementById('chatSendBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    const backBtn = document.getElementById('chatBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            const sidebar = document.querySelector('.chat-sidebar');
            if (sidebar) sidebar.classList.remove('chat-hidden');
            const chatWindow = document.getElementById('chatWindow');
            if (chatWindow) chatWindow.style.display = 'none';
            const chatEmpty = document.getElementById('chatEmpty');
            if (chatEmpty) chatEmpty.style.display = 'flex';
            currentChatUsername = null;
        });
    }
}

async function loadConversations() {
    try {
        const response = await API.getConversations();
        conversationsCache = response.conversations;
        renderChatList(conversationsCache);
        updateChatItemDots();
    } catch (error) {
        // Silently fail for conversations
    }
}

function renderChatList(conversations) {
    const container = document.getElementById('chatList');
    if (!container) return;
    
    if (conversations.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>暂无聊天</p></div>';
        return;
    }
    
    container.innerHTML = conversations.map(conv => `
        <div class="chat-item" data-username="${conv.username}">
            <img class="chat-item-avatar" src="${getAvatarUrl(conv.avatar)}" alt="${conv.username}" onerror="avatarOnError(this)">
            <div class="chat-item-info">
                <div class="chat-item-name">${conv.username}</div>
                <div class="chat-item-last-msg">${conv.last_message}</div>
            </div>
            <span class="chat-item-time">${formatTime(conv.last_time)}</span>
            <span class="chat-item-dot ${unreadMessages.has(conv.username) ? '' : 'hidden'}"></span>
        </div>
    `).join('');
    
    container.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', () => {
            const username = item.dataset.username;
            openChat(username);
        });
    });
}

async function openChat(username) {
    unreadMessages.delete(username);
    updateNavDot();
    
    currentChatUsername = username;
    
    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.chat-item[data-username="${username}"]`)?.classList.add('active');
    
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.chat-sidebar');
        if (sidebar) sidebar.classList.add('chat-hidden');
    }
    
    document.getElementById('chatEmpty').style.display = 'none';
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.style.display = 'flex';
    
    const conv = conversationsCache.find(c => c.username === username);
    if (conv) {
        document.getElementById('chatWindowAvatar').src = getAvatarUrl(conv.avatar);
        document.getElementById('chatWindowAvatar').onerror = function() { avatarOnError(this); };
    }
    document.getElementById('chatWindowName').textContent = username;
    
    try {
        const response = await API.getMessages(username);
        const messages = response.messages;
        
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = messages.map(msg => {
            const isSent = msg.from === currentUser.username;
            const avatar = isSent ? currentUser.avatar : (conv ? conv.avatar : '');
            return `
                <div class="message ${isSent ? 'sent' : 'received'}">
                    <img class="message-avatar" src="${getAvatarUrl(avatar)}" alt="" onerror="avatarOnError(this)">
                    <div>
                        <div class="message-bubble">${msg.content}</div>
                        <div class="message-time">${formatTime(msg.created_at)}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        showToast('加载消息失败', 'error');
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    if (!currentChatUsername) {
        showToast('请先选择一个聊天', 'error');
        return;
    }
    
    if (socket) {
        socket.emit('send_message', {to: currentChatUsername, content: text});
        input.value = '';
    } else {
        try {
            await API.sendMessage(currentChatUsername, text);
            input.value = '';
            openChat(currentChatUsername);
            loadConversations();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }
}

function appendMessage(msg) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    const isSent = msg.from === currentUser.username;
    const conv = conversationsCache.find(c => c.username === msg.from) || conversationsCache.find(c => c.username === msg.to);
    const avatar = isSent ? currentUser.avatar : (conv ? conv.avatar : '');
    
    const msgHtml = `
        <div class="message ${isSent ? 'sent' : 'received'}">
            <img class="message-avatar" src="${getAvatarUrl(avatar)}" alt="" onerror="avatarOnError(this)">
            <div>
                <div class="message-bubble">${msg.content}</div>
                <div class="message-time">${formatTime(msg.created_at)}</div>
            </div>
        </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', msgHtml);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatTime(isoStr) {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } else if (days === 1) {
        return '昨天';
    } else if (days < 7) {
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return weekdays[date.getDay()];
    } else {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
}
