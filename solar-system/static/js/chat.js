// 对话系统模块
const ChatManager = {
    isWaiting: false,  // 是否正在等待回复

    // 初始化
    init() {
        this.bindEvents();
    },

    // 绑定事件
    bindEvents() {
        const searchBox = document.getElementById('search-box');
        const searchInput = document.getElementById('search-input');
        const chatPanel = document.getElementById('chat-panel');
        const chatClose = document.getElementById('chat-close');
        const chatSend = document.getElementById('chat-send');
        const chatInput = document.getElementById('chat-input');

        console.log('ChatManager init:', { searchBox, chatPanel, searchInput });

        // 点击搜索框打开聊天面板
        if (searchBox) {
            searchBox.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Search box clicked');
                if (chatPanel) {
                    chatPanel.classList.add('show');
                    console.log('Chat panel shown');
                }
            });
        }

        // 搜索输入框点击时不关闭
        if (searchInput) {
            searchInput.addEventListener('click', (e) => {
                e.stopPropagation();
                if (chatPanel) chatPanel.classList.add('show');
            });
        }

        // 关闭按钮
        if (chatClose && chatPanel) {
            chatClose.addEventListener('click', (e) => {
                e.stopPropagation();
                chatPanel.classList.remove('show');
            });
        }

        // 点击外部关闭
        document.addEventListener('click', () => {
            if (chatPanel) chatPanel.classList.remove('show');
        });

        // 阻止点击面板内部关闭
        if (chatPanel) {
            chatPanel.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // 发送消息
        if (chatSend && chatInput) {
            chatSend.addEventListener('click', () => {
                this.sendMessage();
            });

            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !this.isWaiting) {
                    this.sendMessage();
                }
            });
        }

        // 搜索框回车
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !this.isWaiting) {
                    const text = searchInput.value.trim();
                    if (text) {
                        if (chatPanel) chatPanel.classList.add('show');
                        setTimeout(() => {
                            this.sendMessage(text);
                            searchInput.value = '';
                        }, 100);
                    }
                }
            });
        }
    },

    // 发送消息
    async sendMessage(text) {
        const chatInput = document.getElementById('chat-input');
        const message = text || chatInput.value.trim();
        if (!message || this.isWaiting) return;

        // 添加用户消息
        this.addMessage(message, 'user');
        if (chatInput) chatInput.value = '';

        // 显示等待状态
        this.isWaiting = true;
        this.setSendButtonDisabled(true);

        // 添加 AI 思考中的消息
        const thinkingId = this.addThinkingMessage();

        try {
            // 调用 API
            const response = await this.callLLM(message);
            
            // 移除思考中消息
            this.removeMessage(thinkingId);
            
            // 添加 AI 回复
            this.addMessage(response, 'ai');
        } catch (error) {
            console.error('Chat error:', error);
            this.removeMessage(thinkingId);
            this.addMessage('抱歉，出现了一些问题，请稍后再试。', 'ai');
        } finally {
            this.isWaiting = false;
            this.setSendButtonDisabled(false);
        }
    },

    // 调用 LLM API
    async callLLM(message) {
        const lang = LanguageManager.getLang();
        const systemPrompt = lang === 'zh' 
            ? '你是一个太阳系知识助手，专门回答关于太阳系、行星、天文等方面的问题。回答要简洁有趣，适合学生学习。'
            : 'You are a Solar System knowledge assistant, specializing in answering questions about the solar system, planets, and astronomy. Keep answers concise and interesting for students.';

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                language: lang,
                system_prompt: systemPrompt
            })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        return data.reply || '抱歉，我暂时无法回答这个问题。';
    },

    // 添加消息
    addMessage(text, type) {
        const messagesContainer = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message ' + type;
        msgDiv.textContent = text;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    // 添加思考中消息
    addThinkingMessage() {
        const id = 'thinking-' + Date.now();
        const messagesContainer = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message ai';
        msgDiv.id = id;
        msgDiv.textContent = '🤔 思考中...';
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return id;
    },

    // 移除消息
    removeMessage(id) {
        const msg = document.getElementById(id);
        if (msg) msg.remove();
    },

    // 设置发送按钮状态
    setSendButtonDisabled(disabled) {
        const chatSend = document.getElementById('chat-send');
        if (chatSend) {
            chatSend.disabled = disabled;
            chatSend.style.opacity = disabled ? '0.5' : '1';
            chatSend.style.cursor = disabled ? 'not-allowed' : 'pointer';
        }
    },

    // 获取占位回复（备用）
    getPlaceholderResponse() {
        const lang = LanguageManager.getLang();
        return lang === 'zh'
            ? '🤖 功能开发中，后续将接入 AI 助手...'
            : '🤖 Feature in development, AI assistant coming soon...';
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    ChatManager.init();
});
