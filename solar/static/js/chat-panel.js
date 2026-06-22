/**
 * ChatPanel - AI 对话面板模块
 *
 * 顶部搜索框为入口，点击打开对话面板（弹层）。
 * 语言切换时刷新标题、欢迎语、输入框 placeholder、发送按钮文字。
 * isWaiting 防重复发送。
 */

const ChatPanel = {
    _isWaiting: false,
    _container: null,
    _panelOpen: false,

    // ==================== 初始化 ====================

    init(containerId) {
        this._container = document.getElementById(containerId);
        if (!this._container) return;

        this._bindEvents();

        // 语言切换
        document.addEventListener('languageChanged', () => {
            this._updateLabels();
        });
    },

    // ==================== 事件绑定 ====================

    _bindEvents() {
        const searchBox = document.getElementById('search-box');
        const searchInput = document.getElementById('search-input');
        const chatClose = document.getElementById('chat-close');
        const chatSend = document.getElementById('chat-send');
        const chatInput = document.getElementById('chat-input');
        const self = this;

        // 点击搜索框打开面板
        if (searchBox) {
            searchBox.addEventListener('click', (e) => {
                e.stopPropagation();
                self._open();
            });
        }

        // 搜索输入框聚焦也打开
        if (searchInput) {
            searchInput.addEventListener('focus', () => self._open());
            searchInput.addEventListener('click', (e) => e.stopPropagation());
        }

        // 关闭按钮
        if (chatClose) {
            chatClose.addEventListener('click', (e) => {
                e.stopPropagation();
                self._close();
            });
        }

        // 点击外部关闭
        document.addEventListener('click', () => self._close());

        // 阻止面板内部冒泡
        if (this._container) {
            this._container.addEventListener('click', (e) => e.stopPropagation());
        }

        // 发送消息
        if (chatSend && chatInput) {
            chatSend.addEventListener('click', () => self._send());
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !self._isWaiting) self._send();
            });
        }

        // 搜索框回车
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !self._isWaiting) {
                    const text = searchInput.value.trim();
                    if (text) {
                        self._open();
                        setTimeout(() => {
                            self._send(text);
                            searchInput.value = '';
                        }, 100);
                    }
                }
            });
        }
    },

    // ==================== 面板开关 ====================

    _open() {
        if (this._panelOpen) return;
        this._panelOpen = true;
        this._container.classList.add('show');
    },

    _close() {
        if (!this._panelOpen) return;
        this._panelOpen = false;
        this._container.classList.remove('show');
    },

    // ==================== 发送消息 ====================

    async _send(text) {
        const chatInput = document.getElementById('chat-input');
        const message = text || chatInput.value.trim();
        if (!message || this._isWaiting) return;

        this._addMessage(message, 'user');
        if (chatInput) chatInput.value = '';

        this._isWaiting = true;
        this._setSendDisabled(true);

        const thinkingId = this._addThinking();

        try {
            const response = await this._callLLM(message);
            this._removeMessage(thinkingId);
            this._addMessage(response, 'ai');
        } catch (e) {
            console.error('Chat error:', e);
            this._removeMessage(thinkingId);
            this._addMessage(this._t('抱歉，出现了一些问题，请稍后再试。', 'Sorry, something went wrong. Please try again.'), 'ai');
        } finally {
            this._isWaiting = false;
            this._setSendDisabled(false);
        }
    },

    // ==================== LLM 调用 ====================

    async _callLLM(message) {
        const lang = LanguageManager.getLang();
        const systemPrompt = lang === 'zh'
            ? '你是一个太阳系知识助手，专门回答关于太阳系、行星、天文等方面的问题。回答要简洁有趣，适合学生学习。'
            : 'You are a Solar System knowledge assistant, specializing in answering questions about the solar system, planets, and astronomy. Keep answers concise and interesting for students.';

        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, language: lang, system_prompt: systemPrompt })
        });

        if (!res.ok) throw new Error('API request failed');
        const data = await res.json();
        return data.reply || this._t('抱歉，我暂时无法回答这个问题。', 'Sorry, I cannot answer this right now.');
    },

    // ==================== 消息渲染 ====================

    _addMessage(text, type) {
        const container = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.className = 'chat-message ' + type;
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    _addThinking() {
        const id = 'thinking-' + Date.now();
        const container = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.className = 'chat-message ai';
        div.id = id;
        div.textContent = this._t('🤔 思考中...', '🤔 Thinking...');
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return id;
    },

    _removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    },

    _setSendDisabled(disabled) {
        const btn = document.getElementById('chat-send');
        if (btn) {
            btn.disabled = disabled;
            btn.style.opacity = disabled ? '0.5' : '1';
            btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
        }
    },

    // ==================== 语言切换 ====================

    _updateLabels() {
        const h4 = this._container?.querySelector('.chat-header h4');
        if (h4) h4.textContent = this._t('🤖 太阳系探索助手', '🤖 Solar System Assistant');

        // 欢迎语
        const welcome = document.getElementById('chat-welcome');
        if (welcome) {
            welcome.textContent = this._t(
                '你好！我是太阳系探索助手。🌌 有什么关于太阳系的问题吗？',
                'Hello! I\'m your Solar System assistant. 🌌 Any questions about the solar system?'
            );
        }

        // placeholder
        const chatInput = document.getElementById('chat-input');
        if (chatInput) chatInput.placeholder = this._t('输入你的问题...', 'Type your question...');

        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.placeholder = this._t('输入问题，探索太阳系...', 'Ask anything about the Solar System...');

        // 发送按钮
        const sendBtn = document.getElementById('chat-send');
        if (sendBtn) sendBtn.textContent = this._t('发送', 'Send');
    },

    // ==================== 工具 ====================

    _t(zh, en) { return LanguageManager.getLang() === 'zh' ? zh : en; }
};

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    ChatPanel.init('chat-panel');
});
