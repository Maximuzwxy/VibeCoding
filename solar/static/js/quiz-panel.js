/**
 * QuizPanel - 答题面板模块
 *
 * 双模式（local/online），本地题库只会加载一次（shuffle），
 * 在线生成在一次请求返回之前不会重复请求（isLoadingOnline 守卫），
 * 已生成的在线题目会被缓存，切换回本地再切回在线不会重新请求。
 *
 * 语言切换：所有用户可见文本通过 LanguageManager.t() 获取，
 * 监听 languageChanged 事件自动重渲染题目 + 反馈 + 模式按钮 + 按钮文字。
 */

const QuizPanel = {
    // ==================== 状态 ====================
    _mode: 'local',               // 'local' | 'online'
    _topic: null,                 // 题库主题

    // 本地模式状态
    _localQuestions: [],          // 打乱后的本地题目
    _localIndex: 0,
    _localHasAnswered: false,
    _localUserSelection: null,

    // 在线模式状态
    _onlineQuestions: [],         // 已生成的在线题目（缓存！）
    _onlineIndex: 0,
    _onlineHasAnswered: false,
    _onlineUserSelection: null,
    _isLoadingOnline: false,      // 防重复请求守卫

    // 视图代理（当前模式是什么就指到哪套状态）
    _questions: [],
    _currentIndex: 0,
    _container: null,

    // ==================== 初始化 ====================

    init(containerId) {
        this._container = document.getElementById(containerId);
        if (!this._container) return;

        this._bindEvents();

        // 语言切换 → 重渲染题目文本 + 反馈 + 模式按钮 + UI 按钮文字
        document.addEventListener('languageChanged', () => {
            this._updateModeButtons();
            this._updatePanelTitle();
            // loading 中只更新 loading 文字，不重新渲染
            if (this._isLoadingOnline) {
                this._el('question-text').textContent = this._t('加载中...', 'Loading...');
                return;
            }
            if (this._questions.length > 0) {
                this._renderQuestion();
                if (this._hasAnswered()) this._showFeedback();
                this._updateNavButtons();
            }
        });
    },

    /** 加载题库（仅本地） */
    async load(topicId) {
        this._topic = topicId;
        this._resetStates();
        this._updatePanelTitle();
        // 切天体后清空所有 UI 残留（反馈/完成提示）
        this._el('feedback').classList.remove('show');
        this._hide('next-btn', 'save-btn', 'complete-message');
        await this._loadLocal();
    },

    /** 切换模式 */
    switchMode(mode) {
        if (mode === this._mode) return;
        this._mode = mode;
        this._updateModeButtons();

        // 隐藏所有 UI
        this._hide('next-btn', 'save-btn', 'complete-message');
        this._el('feedback').classList.remove('show');

        if (mode === 'local') {
            // 本地 → 如果已有数据直接恢复，否则加载
            if (this._localQuestions.length > 0) {
                this._syncView('local');
                this._renderQuestion();
                if (this._localHasAnswered) this._restoreAnsweredState();
            } else {
                this._loadLocal();
            }
        } else {
            // 在线 → 如果正在请求中 → 显示 loading
            if (this._isLoadingOnline) {
                this._el('question-text').textContent = this._t('加载中...', 'Loading...');
                this._el('options-container').innerHTML = '';
                return;
            }
            // 已生成过 → 直接恢复缓存
            if (this._onlineQuestions.length > 0) {
                this._syncView('online');
                this._renderQuestion();
                if (this._onlineHasAnswered) this._restoreAnsweredState();
                return;
            }
            // 首次进入在线 → 先清空界面显示 loading，再发起请求
            this._el('question-text').textContent = this._t('加载中...', 'Loading...');
            this._el('options-container').innerHTML = '';
            this._loadOnline();
        }
    },

    /** 选择答案 */
    _selectAnswer(selectedIndex, btnEl) {
        if (this._hasAnswered()) return;

        const q = this._questions[this._currentIndex];
        const options = this._container.querySelectorAll('.option-btn');

        options.forEach(o => o.classList.add('disabled'));

        const isCorrect = selectedIndex === q.answer;
        if (isCorrect) {
            btnEl.classList.add('correct');
        } else {
            btnEl.classList.add('wrong');
            options[q.answer].classList.add('correct');
        }

        this._setHasAnswered(true);
        this._setUserSelection(selectedIndex);
        this._showFeedback();
        this._updateNavButtons();
    },

    /** 下一题 */
    nextQuestion() {
        if (this._currentIndex >= this._questions.length - 1) {
            if (this._mode === 'online' && !this._isLoadingOnline) {
                this._loadOnline(); // 继续生成
            }
            return;
        }

        this._currentIndex++;
        this._syncIndexBack();

        this._setHasAnswered(false);
        this._setUserSelection(null);
        this._el('feedback').classList.remove('show');
        this._hide('next-btn', 'save-btn', 'complete-message');
        this._renderQuestion();
    },

    /** 保存当前题目到题库 */
    async saveCurrentQuestion() {
        const q = this._questions[this._currentIndex];
        if (!q) return;
        const lang = LanguageManager.getLang();

        const questionData = {
            id: q.id || ('q_' + Date.now().toString(36)),
            question: typeof q.question === 'object' ? q.question : { zh: q.question, en: '' },
            options: q.options.map(o => typeof o === 'object' ? o : { zh: o, en: '' }),
            answer: q.answer,
            explanation: typeof q.explanation === 'object' ? q.explanation : { zh: q.explanation || '', en: '' }
        };
        const questionText = typeof q.question === 'object' ? q.question[lang] : q.question;

        // 去重检查
        try {
            const r = await fetch(`/api/quiz/${this._topic}`);
            const d = await r.json();
            const dup = (d.questions || []).some(eq => {
                const t = typeof eq.question === 'object' ? eq.question[lang] : eq.question;
                return t === questionText;
            });
            if (dup) { this._showToast(this._t('⚠️ 题目已存在', '⚠️ Already exists')); return; }
        } catch (e) { /* ignore */ }

        this._showConfirmDialog(questionText, async () => {
            try {
                const r = await fetch('/api/quiz/save', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic: this._topic, question: questionData })
                });
                const d = await r.json();
                this._showToast(d.success
                    ? this._t('✅ 已加入题库', '✅ Added to quiz bank')
                    : this._t('❌ 保存失败', '❌ Save failed'),
                    d.success ? 'success' : 'error');
            } catch (e) {
                this._showToast(this._t('❌ 保存失败', '❌ Save failed'), 'error');
            }
        });
    },

    // ==================== 内部：加载 ====================

    async _loadLocal() {
        const topicSnapshot = this._topic;
        try {
            const res = await fetch(`/api/quiz/${this._topic}`);
            const data = await res.json();
            // 已经切走了，丢弃
            if (this._topic !== topicSnapshot) return;

            this._localQuestions = this._shuffle(data.questions || []);
            this._localIndex = 0;
            this._localHasAnswered = false;
            this._localUserSelection = null;

            if (this._mode === 'local') {
                this._syncView('local');
                this._renderQuestion();
            }
        } catch (e) {
            console.error('QuizPanel local load error:', e);
        }
    },

    async _loadOnline() {
        if (this._isLoadingOnline) return; // 守卫：有请求进行中就不再发

        // 如果还在在线模式，先显示 loading
        if (this._mode === 'online') {
            this._el('question-text').textContent = this._t('加载中...', 'Loading...');
            this._el('options-container').innerHTML = '';
            this._el('feedback').classList.remove('show');
            this._hide('next-btn', 'save-btn', 'complete-message');
        }

        this._isLoadingOnline = true;
        const topicSnapshot = this._topic;
        const lang = LanguageManager.getLang();

        // 收集本地题目文字用于去重
        let existingTexts = [];
        try {
            const r = await fetch(`/api/quiz/${this._topic}`);
            const d = await r.json();
            existingTexts = (d.questions || []).map(q =>
                typeof q.question === 'object' ? q.question[lang] : q.question
            );
        } catch (e) { /* ignore */ }

        try {
            const res = await fetch('/api/quiz/generate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: this._topic, language: lang, exclude_questions: existingTexts
                })
            });
            const data = await res.json();
            // 已经切走了，丢弃
            if (this._topic !== topicSnapshot) return;

            let newQuestions = data.questions || [];

            // 前端去重
            newQuestions = newQuestions.filter(q => {
                const t = typeof q.question === 'object' ? q.question[lang] : q.question;
                return !existingTexts.includes(t);
            });

            // 追加到缓存（保留之前的在线题目！）
            if (this._onlineQuestions.length > 0) {
                this._onlineQuestions = this._onlineQuestions.concat(newQuestions);
            } else {
                this._onlineQuestions = newQuestions;
            }

            if (this._onlineIndex >= this._onlineQuestions.length) {
                this._onlineIndex = 0;
            }

            // 如果还在在线模式，同步视图
            if (this._mode === 'online') {
                this._onlineHasAnswered = false;
                this._onlineUserSelection = null;
                this._syncView('online');
                this._renderQuestion();
            }
        } catch (e) {
            console.error('QuizPanel online load error:', e);
        } finally {
            this._isLoadingOnline = false;
        }
    },

    // ==================== 内部：渲染 ====================

    _renderQuestion() {
        if (this._questions.length === 0) {
            this._el('question-text').textContent = this._t('暂无题目', 'No questions');
            return;
        }
        const q = this._questions[this._currentIndex];
        const lang = LanguageManager.getLang();

        this._el('question-text').textContent =
            typeof q.question === 'object' ? q.question[lang] : q.question;

        const container = this._el('options-container');
        container.innerHTML = '';

        const labels = ['A', 'B', 'C', 'D'];
        q.options.forEach((o, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = `<span class="option-label">${labels[i]}</span><span>${typeof o === 'object' ? o[lang] : o}</span>`;
            btn.addEventListener('click', () => this._selectAnswer(i, btn));
            container.appendChild(btn);
        });
    },

    _showFeedback() {
        const q = this._questions[this._currentIndex];
        const lang = LanguageManager.getLang();
        const isCorrect = this._getUserSelection() === q.answer;
        const fb = this._el('feedback');
        fb.className = 'feedback show ' + (isCorrect ? 'correct' : 'wrong');
        this._el('feedback-title').textContent = isCorrect
            ? this._t('✅ 回答正确！', '✅ Correct!')
            : this._t('❌ 回答错误', '❌ Incorrect');
        const exp = typeof q.explanation === 'object' ? q.explanation[lang] : q.explanation;
        this._el('feedback-explanation').textContent = exp || '';
    },

    /** 恢复已答题状态（切换模式回来时用） */
    _restoreAnsweredState() {
        const q = this._questions[this._currentIndex];
        if (!q) return;
        const lang = LanguageManager.getLang();
        const sel = this._getUserSelection();
        const isCorrect = sel === q.answer;
        const options = this._container.querySelectorAll('.option-btn');

        if (isCorrect) {
            options[sel].classList.add('correct');
        } else {
            options[sel].classList.add('wrong');
            options[q.answer].classList.add('correct');
        }
        this._showFeedback();
        this._updateNavButtons();
    },

    /** 根据当前模式 + 是否最后一题，决定按钮显示 */
    _updateNavButtons() {
        const nextBtn = this._el('next-btn');
        const saveBtn = this._el('save-btn');
        const completeEl = this._el('complete-message');
        const isLast = this._currentIndex >= this._questions.length - 1;
        const lang = LanguageManager.getLang();

        if (this._mode === 'local' && isLast) {
            // 本地题库做完
            this._hide('next-btn', 'save-btn');
            completeEl.style.display = 'flex';
            completeEl.textContent = this._t('✅ 题目已做完', '✅ Quiz Complete');
        } else if (this._mode === 'online' && isLast) {
            // 在线题目做完 → 可以继续生成
            nextBtn.style.display = 'block';
            nextBtn.textContent = this._t('📥 继续生成题目', '📥 Generate More');
            saveBtn.style.display = 'block';
            this._hide('complete-message');
        } else if (this._hasAnswered()) {
            nextBtn.style.display = 'block';
            nextBtn.textContent = this._t('⏭ 下一题', '⏭ Next');
            saveBtn.style.display = this._mode === 'online' ? 'block' : 'none';
            this._hide('complete-message');
        }
    },

    /** 更新模式按钮文字 + 激活态 */
    _updateModeButtons() {
        const localBtn = this._el('mode-local');
        const onlineBtn = this._el('mode-online');
        if (localBtn) {
            localBtn.textContent = this._t('本地题库', 'Local');
            localBtn.classList.toggle('active', this._mode === 'local');
        }
        if (onlineBtn) {
            onlineBtn.textContent = this._t('在线生成', 'Online');
            onlineBtn.classList.toggle('active', this._mode === 'online');
        }
    },

    /** 更新面板标题 */
    _updatePanelTitle() {
        const h3 = this._container?.querySelector('h3');
        if (h3) h3.textContent = this._t('📝 太阳系知识挑战', '📝 Solar System Quiz');
    },

    // ==================== 内部：状态同步 ====================

    _resetStates() {
        this._localQuestions = [];
        this._localIndex = 0;
        this._localHasAnswered = false;
        this._localUserSelection = null;
        this._onlineQuestions = [];
        this._onlineIndex = 0;
        this._onlineHasAnswered = false;
        this._onlineUserSelection = null;
        this._isLoadingOnline = false;
        this._questions = [];
        this._currentIndex = 0;
        this._mode = 'local';
        this._updateModeButtons();
    },

    _syncView(mode) {
        if (mode === 'local') {
            this._questions = this._localQuestions;
            this._currentIndex = this._localIndex;
        } else {
            this._questions = this._onlineQuestions;
            this._currentIndex = this._onlineIndex;
        }
    },

    _syncIndexBack() {
        if (this._mode === 'local') {
            this._localIndex = this._currentIndex;
        } else {
            this._onlineIndex = this._currentIndex;
        }
    },

    _hasAnswered() {
        return this._mode === 'local' ? this._localHasAnswered : this._onlineHasAnswered;
    },

    _setHasAnswered(v) {
        if (this._mode === 'local') this._localHasAnswered = v; else this._onlineHasAnswered = v;
    },

    _getUserSelection() {
        return this._mode === 'local' ? this._localUserSelection : this._onlineUserSelection;
    },

    _setUserSelection(v) {
        if (this._mode === 'local') this._localUserSelection = v; else this._onlineUserSelection = v;
    },

    // ==================== 事件绑定 ====================

    _bindEvents() {
        this._el('mode-local')?.addEventListener('click', () => this.switchMode('local'));
        this._el('mode-online')?.addEventListener('click', () => this.switchMode('online'));
        this._el('next-btn')?.addEventListener('click', () => this.nextQuestion());
        this._el('save-btn')?.addEventListener('click', () => this.saveCurrentQuestion());
    },

    // ==================== 工具 ====================

    _el(id) { return this._container?.querySelector('#' + id); },
    _t(zh, en) { return LanguageManager.getLang() === 'zh' ? zh : en; },
    _hide(...ids) { ids.forEach(id => { const e = this._el(id); if (e) e.style.display = 'none'; }); },

    _shuffle(a) { const s = [...a]; for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; } return s; },

    // ==================== Toast & Dialog ====================

    _showToast(msg, type) {
        const old = document.querySelector('.quiz-toast');
        if (old) old.remove();
        const t = document.createElement('div');
        t.className = 'quiz-toast' + (type ? ' quiz-toast-' + type : '');
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t?.remove(), 2500);
    },

    _showConfirmDialog(questionText, onConfirm) {
        const old = document.querySelector('.quiz-dialog-overlay');
        if (old) old.remove();

        const lang = LanguageManager.getLang();
        const overlay = document.createElement('div');
        overlay.className = 'quiz-dialog-overlay';
        overlay.innerHTML = `
            <div class="quiz-dialog">
                <div class="quiz-dialog-header">
                    <span class="quiz-dialog-title">${this._t('加入题库', 'Save to Quiz Bank')}</span>
                    <button class="quiz-dialog-close">&times;</button>
                </div>
                <div class="quiz-dialog-body">
                    <p class="quiz-dialog-message">${this._t('确定要将这道题加入题库吗？', 'Add this question?')}</p>
                    <div class="quiz-dialog-question">${questionText}</div>
                </div>
                <div class="quiz-dialog-footer">
                    <button class="quiz-dialog-btn quiz-dialog-cancel">${this._t('取消', 'Cancel')}</button>
                    <button class="quiz-dialog-btn quiz-dialog-confirm">${this._t('确认加入', 'Confirm')}</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        overlay.querySelector('.quiz-dialog-close').onclick = close;
        overlay.querySelector('.quiz-dialog-cancel').onclick = close;
        overlay.querySelector('.quiz-dialog-confirm').onclick = () => { close(); onConfirm(); };
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    }
};
