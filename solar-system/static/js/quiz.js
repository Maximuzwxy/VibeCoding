// 答题系统模块
const QuizManager = {
    // 当前模式（决定使用哪组状态）
    mode: 'local',
    topic: 'solar_system',

    // 当前模式的"视图"（切换模式时更新）
    questions: [],
    currentQuestion: 0,

    // 本地模式状态（独立）
    localQuestions: [],
    localCurrentQuestion: 0,
    localHasAnswered: false,      // 当前题目是否已答
    localUserSelection: null,     // 用户选的选项索引（0-3）

    // 在线模式状态（独立）
    onlineQuestions: [],
    onlineCurrentQuestion: 0,
    onlineHasAnswered: false,     // 当前题目是否已答
    onlineUserSelection: null,    // 用户选的选项索引（0-3）
    isLoadingOnline: false,
    loadingAbortController: null,

    // 设置题库主题
    setTopic(newTopic) {
        this.topic = newTopic;
        // 重置状态
        this.localQuestions = [];
        this.localCurrentQuestion = 0;
        this.localHasAnswered = false;
        this.localUserSelection = null;
        this.onlineQuestions = [];
        this.onlineCurrentQuestion = 0;
        this.onlineHasAnswered = false;
        this.onlineUserSelection = null;
        this.questions = [];
        this.currentQuestion = 0;
    },

    // 生成 UUID
    generateUUID() {
        return 'q_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    },

    // 洗牌算法
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    // 初始化
    init() {
        // 从 HTML 读取 topic 配置
        const topicEl = document.getElementById('quiz-topic');
        if (topicEl) {
            this.topic = topicEl.getAttribute('data-topic') || 'solar_system';
        }

        this.bindEvents();
        this.loadQuiz('local');
    },

    // 绑定事件
    bindEvents() {
        document.getElementById('mode-local').addEventListener('click', () => {
            this.switchMode('local');
        });
        document.getElementById('mode-online').addEventListener('click', () => {
            this.switchMode('online');
        });
        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextQuestion();
        });
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveCurrentQuestion();
        });
    },

    // 切换模式
    switchMode(mode) {
        this.mode = mode;
        document.getElementById('mode-local').classList.toggle('active', mode === 'local');
        document.getElementById('mode-online').classList.toggle('active', mode === 'online');

        // ✅ 无论什么情况，先隐藏所有 UI 元素
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('save-btn').style.display = 'none';
        document.getElementById('complete-message').style.display = 'none';
        document.getElementById('feedback').classList.remove('show');

        // 切换到本地模式：直接使用本地状态
        if (mode === 'local') {
            if (this.localQuestions.length > 0) {
                this.questions = this.localQuestions;
                this.currentQuestion = this.localCurrentQuestion;
                this.renderQuestion();
                if (this.localHasAnswered) {
                    this.restoreAnsweredState();
                }
            } else {
                this.loadQuiz(mode);
            }
            return;
        }

        // 切换到在线模式：直接使用在线状态
        if (mode === 'online') {
            if (this.isLoadingOnline) {
                document.getElementById('question-text').textContent = LanguageManager.t('quiz_loading');
                document.getElementById('options-container').innerHTML = '';
                return;
            }

            if (this.onlineQuestions.length > 0) {
                this.questions = this.onlineQuestions;
                this.currentQuestion = this.onlineCurrentQuestion;
                this.renderQuestion();
                if (this.onlineHasAnswered) {
                    this.restoreAnsweredState();
                }
                return;
            }

            this.loadQuiz(mode);
        }
    },

    // 加载题库
    async loadQuiz(mode) {
        // 只在当前模式匹配时才清空答题区域
        if (this.mode === mode) {
            document.getElementById('question-text').textContent = LanguageManager.t('quiz_loading');
            document.getElementById('options-container').innerHTML = '';
            document.getElementById('feedback').classList.remove('show');
            document.getElementById('next-btn').style.display = 'none';
            document.getElementById('save-btn').style.display = 'none';
            document.getElementById('quiz-content').style.display = 'block';
        }

        try {
            if (mode === 'local') {
                await this.loadLocalQuiz();
                // 更新视图
                this.questions = this.localQuestions;
                this.currentQuestion = this.localCurrentQuestion;
            } else {
                await this.loadOnlineQuiz();
                // 只有当前模式仍是在线时，才更新视图
                if (this.mode === 'online') {
                    this.questions = this.onlineQuestions;
                    this.currentQuestion = this.onlineCurrentQuestion;
                }
            }
            
            // 只有当前模式匹配时才渲染
            if (this.mode === mode) {
                this.renderQuestion();
            }
        } catch (error) {
            console.error('Failed to load quiz:', error);
            document.getElementById('question-text').textContent = '加载失败，请重试';
        }
    },

    // 加载本地题库
    async loadLocalQuiz() {
        try {
            const res = await fetch(`/api/quiz/${this.topic}`);
            const data = await res.json();
            let questions = data.questions || [];

            this.localQuestions = this.shuffleArray(questions);
            this.localCurrentQuestion = 0;
        } catch (error) {
            this.localQuestions = [];
            this.localCurrentQuestion = 0;
        }
    },

    // 加载在线题库
    async loadOnlineQuiz() {
        const lang = LanguageManager.getLang();

        // 设置加载状态
        this.isLoadingOnline = true;

        try {
            // 先获取本地题库，用于去重
            const localRes = await fetch(`/api/quiz/${this.topic}`);
            const localData = await localRes.json();
            const localQuestions = localData.questions ? localData.questions.map(q =>
                typeof q.question === 'object' ? q.question[lang] : q.question
            ) : [];

            const res = await fetch('/api/quiz/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: this.topic,
                    language: lang,
                    exclude_questions: localQuestions
                })
            });
            const data = await res.json();
            let newQuestions = data.questions || [];

            // 前端去重检查
            newQuestions = newQuestions.filter(q => {
                const questionText = typeof q.question === 'object' ? q.question[lang] : q.question;
                return !localQuestions.includes(questionText);
            });

            if (this.onlineQuestions.length > 0) {
                this.onlineQuestions = this.onlineQuestions.concat(newQuestions);
            } else {
                this.onlineQuestions = newQuestions;
            }

            this.isLoadingOnline = false;

            if (this.onlineCurrentQuestion >= this.onlineQuestions.length) {
                this.onlineCurrentQuestion = 0;
            }

            // 如果当前模式是在线，同步更新视图
            if (this.mode === 'online') {
                this.questions = this.onlineQuestions;
                this.currentQuestion = this.onlineCurrentQuestion;
            }
        } catch (error) {
            this.isLoadingOnline = false;
            this.onlineQuestions = [];
            this.onlineCurrentQuestion = 0;
        }
    },

    // 渲染题目
    renderQuestion() {
        if (this.questions.length === 0) {
            document.getElementById('question-text').textContent = '暂无题目';
            return;
        }

        const q = this.questions[this.currentQuestion];
        const lang = LanguageManager.getLang();

        // 更新题目文本
        document.getElementById('question-text').textContent =
            typeof q.question === 'object' ? q.question[lang] : q.question;

        // 渲染选项
        const container = document.getElementById('options-container');
        container.innerHTML = '';

        const optionLabels = ['A', 'B', 'C', 'D'];
        q.options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = `
                <span class="option-label">${optionLabels[index]}</span>
                <span>${typeof option === 'object' ? option[lang] : option}</span>
            `;
            btn.addEventListener('click', () => {
                this.selectAnswer(index, btn);
            });
            container.appendChild(btn);
        });

        // 隐藏按钮（UI 状态重置为 IDLE）
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('save-btn').style.display = 'none';
        document.getElementById('complete-message').style.display = 'none';
    },

    // 恢复已答题状态（切换模式时调用）
    restoreAnsweredState() {
        const q = this.questions[this.currentQuestion];
        if (!q) return;

        const lang = LanguageManager.getLang();
        
        // 获取用户选择和正确答案
        const userSelection = this.mode === 'local' 
            ? this.localUserSelection 
            : this.onlineUserSelection;
        const correctAnswer = q.answer;
        const isCorrect = userSelection === correctAnswer;

        // 标记选项（正确/错误）
        const options = document.querySelectorAll('.option-btn');
        if (isCorrect) {
            options[userSelection].classList.add('correct');
        } else {
            options[userSelection].classList.add('wrong');
            options[correctAnswer].classList.add('correct');
        }

        // 显示反馈
        this.showFeedback(isCorrect, q);

        // 显示按钮
        const saveBtn = document.getElementById('save-btn');
        const nextBtn = document.getElementById('next-btn');
        const completeContainer = document.getElementById('complete-message');

        // 检查是否是最后一题
        const isLastQuestion = this.currentQuestion >= this.questions.length - 1;

        if (!isLastQuestion) {
            nextBtn.style.display = 'block';
            nextBtn.textContent = LanguageManager.t('btn_next');
            saveBtn.style.display = this.mode === 'online' ? 'block' : 'none';
            completeContainer.style.display = 'none';
        } else {
            if (this.mode === 'local') {
                nextBtn.style.display = 'none';
                saveBtn.style.display = 'none';
                completeContainer.style.display = 'block';
                completeContainer.textContent = lang === 'zh' ? '✅ 题目已做完' : '✅ Quiz Complete';
            } else {
                nextBtn.textContent = lang === 'zh' ? '📥 继续生成题目' : '📥 Generate More';
                saveBtn.style.display = 'block';
                nextBtn.style.display = 'block';
                completeContainer.style.display = 'none';
            }
        }
    },

    // 选择答案
    selectAnswer(selectedIndex, btnElement) {
        const q = this.questions[this.currentQuestion];
        if (!q) return;

        // 检查是否已经答过题，如果已答则忽略点击
        const hasAnswered = this.mode === 'local' ? this.localHasAnswered : this.onlineHasAnswered;
        if (hasAnswered) return;

        // 禁用所有选项
        const options = document.querySelectorAll('.option-btn');
        options.forEach(opt => opt.classList.add('disabled'));

        const isCorrect = selectedIndex === q.answer;

        // 标记正确/错误
        if (isCorrect) {
            btnElement.classList.add('correct');
        } else {
            btnElement.classList.add('wrong');
            // 显示正确答案
            options[q.answer].classList.add('correct');
        }

        // 保存已答状态和用户选择
        if (this.mode === 'local') {
            this.localHasAnswered = true;
            this.localUserSelection = selectedIndex;
        } else {
            this.onlineHasAnswered = true;
            this.onlineUserSelection = selectedIndex;
        }

        // 显示反馈（UI 状态变为 ANSWERED）
        this.showFeedback(isCorrect, q);

        // 显示按钮
        const saveBtn = document.getElementById('save-btn');
        const nextBtn = document.getElementById('next-btn');
        const completeContainer = document.getElementById('complete-message');
        const lang = LanguageManager.getLang();

        // 检查是否是最后一题
        const isLastQuestion = this.currentQuestion >= this.questions.length - 1;

        if (!isLastQuestion) {
            // 不是最后一题，显示"下一题"
            nextBtn.style.display = 'block';
            nextBtn.textContent = LanguageManager.t('btn_next');

            // 只有在线模式才显示"加入题库"按钮
            saveBtn.style.display = this.mode === 'online' ? 'block' : 'none';
            completeContainer.style.display = 'none';
        } else {
            // 最后一题
            if (this.mode === 'local') {
                // 本地题库：显示"题目已做完"
                nextBtn.style.display = 'none';
                saveBtn.style.display = 'none';
                completeContainer.style.display = 'block';
                completeContainer.textContent = lang === 'zh' ? '✅ 题目已做完' : '✅ Quiz Complete';
            } else {
                // 在线题目：显示"继续生成题目"
                nextBtn.textContent = lang === 'zh' ? '📥 继续生成题目' : '📥 Generate More';
                saveBtn.style.display = 'block';
                nextBtn.style.display = 'block';
                completeContainer.style.display = 'none';
            }
        }
    },

    // 显示反馈
    showFeedback(isCorrect, question) {
        const feedback = document.getElementById('feedback');
        const feedbackTitle = document.getElementById('feedback-title');
        const feedbackExplanation = document.getElementById('feedback-explanation');
        const lang = LanguageManager.getLang();

        feedback.className = 'feedback show ' + (isCorrect ? 'correct' : 'wrong');
        feedbackTitle.textContent = isCorrect
            ? (lang === 'zh' ? '✅ 回答正确！' : '✅ Correct!')
            : (lang === 'zh' ? '❌ 回答错误' : '❌ Incorrect');

        const explanation = typeof question.explanation === 'object'
            ? question.explanation[lang]
            : question.explanation;
        feedbackExplanation.textContent = explanation || '';
    },

    // 下一题
    nextQuestion() {
        // 检查是否还有下一题
        if (this.currentQuestion >= this.questions.length - 1) {
            return;
        }

        // 进度 +1
        this.currentQuestion++;

        // 同步到对应模式的状态变量
        if (this.mode === 'local') {
            this.localCurrentQuestion = this.currentQuestion;
            this.localHasAnswered = false;      // 新题目，重置已答状态
            this.localUserSelection = null;     // 新题目，重置用户选择
        } else {
            this.onlineCurrentQuestion = this.currentQuestion;
            this.onlineHasAnswered = false;     // 新题目，重置已答状态
            this.onlineUserSelection = null;    // 新题目，重置用户选择
        }

        // 隐藏反馈（UI 状态重置为 IDLE）
        document.getElementById('feedback').classList.remove('show');
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('save-btn').style.display = 'none';

        // 渲染新题目（UI 状态自然是 IDLE）
        this.renderQuestion();
    },

    // 保存当前题目到题库
    async saveCurrentQuestion() {
        const q = this.questions[this.currentQuestion];
        const lang = LanguageManager.getLang();
        
        // 确保题目是双语格式
        const questionData = {
            id: q.id || this.generateUUID(),
            question: typeof q.question === 'object' ? q.question : { zh: q.question, en: '' },
            options: q.options.map(opt => typeof opt === 'object' ? opt : { zh: opt, en: '' }),
            answer: q.answer,
            explanation: typeof q.explanation === 'object' ? q.explanation : { zh: q.explanation || '', en: '' }
        };
        
        const questionText = typeof q.question === 'object' ? q.question[lang] : q.question;

        // 先检查本地题库中是否已存在
        try {
            const localRes = await fetch(`/api/quiz/${this.topic}`);
            const localData = await localRes.json();
            const existingQuestions = localData.questions || [];

            for (const eq of existingQuestions) {
                const existingText = typeof eq.question === 'object'
                    ? eq.question[lang]
                    : eq.question;
                if (existingText === questionText) {
                    this.showDuplicateDialog(questionText);
                    return;
                }
            }
        } catch (error) {
            console.error('Check duplicate error:', error);
        }

        // 显示确认对话框
        this.showConfirmDialog(
            lang === 'zh' ? '加入题库' : 'Save to Quiz Bank',
            lang === 'zh'
                ? `确定要将这道题加入"${this.topic}"题库吗？`
                : `Are you sure you want to add this question to the "${this.topic}" quiz bank?`,
            questionText,
            async () => {
                try {
                    const res = await fetch('/api/quiz/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            topic: this.topic,
                            question: questionData  // 发送格式化后的双语数据
                        })
                    });

                    const result = await res.json();

                    if (result.success) {
                        this.showToast(
                            lang === 'zh' ? '✅ 已加入题库' : '✅ Added to quiz bank',
                            'success'
                        );
                    } else if (result.duplicate) {
                        this.showDuplicateDialog(questionText);
                    } else {
                        this.showToast(
                            lang === 'zh' ? '❌ 保存失败：' + (result.error || '') : '❌ Save failed: ' + (result.error || ''),
                            'error'
                        );
                    }
                } catch (error) {
                    console.error('Save error:', error);
                    this.showToast(
                        lang === 'zh' ? '❌ 保存失败，请稍后重试' : '❌ Save failed, please try again',
                        'error'
                    );
                }
            }
        );
    },

    // 显示确认对话框
    showConfirmDialog(title, message, questionText, onConfirm) {
        const lang = LanguageManager.getLang();
        const existing = document.getElementById('quiz-confirm-dialog');
        if (existing) existing.remove();

        const dialog = document.createElement('div');
        dialog.id = 'quiz-confirm-dialog';
        dialog.className = 'quiz-dialog-overlay';
        dialog.innerHTML = `
            <div class="quiz-dialog">
                <div class="quiz-dialog-header">
                    <span class="quiz-dialog-title">${title}</span>
                    <button class="quiz-dialog-close" id="dialog-close-btn">&times;</button>
                </div>
                <div class="quiz-dialog-body">
                    <p class="quiz-dialog-message">${message}</p>
                    <div class="quiz-dialog-question">${questionText}</div>
                </div>
                <div class="quiz-dialog-footer">
                    <button class="quiz-dialog-btn quiz-dialog-cancel" id="dialog-cancel-btn">
                        ${lang === 'zh' ? '取消' : 'Cancel'}
                    </button>
                    <button class="quiz-dialog-btn quiz-dialog-confirm" id="dialog-confirm-btn">
                        ${lang === 'zh' ? '确认加入' : 'Confirm'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        setTimeout(() => {
            document.getElementById('dialog-close-btn').addEventListener('click', () => dialog.remove());
            document.getElementById('dialog-cancel-btn').addEventListener('click', () => dialog.remove());
            document.getElementById('dialog-confirm-btn').addEventListener('click', () => {
                dialog.remove();
                onConfirm();
            });
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) dialog.remove();
            });
        }, 10);
    },

    // 显示重复提示对话框
    showDuplicateDialog(questionText) {
        const lang = LanguageManager.getLang();
        const existing = document.getElementById('quiz-confirm-dialog');
        if (existing) existing.remove();

        const dialog = document.createElement('div');
        dialog.id = 'quiz-confirm-dialog';
        dialog.className = 'quiz-dialog-overlay';
        dialog.innerHTML = `
            <div class="quiz-dialog">
                <div class="quiz-dialog-header">
                    <span class="quiz-dialog-title">${lang === 'zh' ? '题目已存在' : 'Question Exists'}</span>
                    <button class="quiz-dialog-close" id="dialog-close-btn">&times;</button>
                </div>
                <div class="quiz-dialog-body">
                    <p class="quiz-dialog-message">
                        ${lang === 'zh' ? '这道题在题库中已经存在，无需重复添加。' : 'This question already exists in the quiz bank.'}
                    </p>
                    <div class="quiz-dialog-question">${questionText}</div>
                </div>
                <div class="quiz-dialog-footer">
                    <button class="quiz-dialog-btn quiz-dialog-cancel" id="dialog-ok-btn" style="flex: 1;">
                        ${lang === 'zh' ? '知道了' : 'OK'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        setTimeout(() => {
            document.getElementById('dialog-close-btn').addEventListener('click', () => dialog.remove());
            document.getElementById('dialog-ok-btn').addEventListener('click', () => dialog.remove());
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) dialog.remove();
            });
        }, 10);
    },

    // 显示 Toast 提示
    showToast(message, type = 'success') {
        const existing = document.getElementById('quiz-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'quiz-toast';
        toast.className = `quiz-toast quiz-toast-${type} quiz-toast-show`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('quiz-toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // 继续生成在线题目（追加 10 道）
    async loadMoreOnlineQuestions() {
        const lang = LanguageManager.getLang();
        const nextBtn = document.getElementById('next-btn');
        const originalText = nextBtn.textContent;

        // UI 状态变为 LOADING
        nextBtn.textContent = lang === 'zh' ? '⏳ 生成中...' : '⏳ Generating...';
        nextBtn.disabled = true;

        try {
            // 获取本地题库用于去重
            const localRes = await fetch(`/api/quiz/${this.topic}`);
            const localData = await localRes.json();
            const localQuestions = localData.questions ? localData.questions.map(q =>
                typeof q.question === 'object' ? q.question[lang] : q.question
            ) : [];

            // 同时排除已生成的在线题目
            const existingOnlineQuestions = this.onlineQuestions.map(q =>
                typeof q.question === 'object' ? q.question[lang] : q.question
            );
            const excludeQuestions = [...localQuestions, ...existingOnlineQuestions];

            const res = await fetch('/api/quiz/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: this.topic,
                    language: lang,
                    exclude_questions: excludeQuestions
                })
            });
            const data = await res.json();
            const newQuestions = data.questions || [];

            if (newQuestions.length === 0) {
                this.showToast(
                    lang === 'zh' ? '抱歉，无法生成更多题目' : 'Sorry, unable to generate more questions',
                    'error'
                );
                nextBtn.textContent = originalText;
                nextBtn.disabled = false;
                return;
            }

            // 追加到在线状态
            this.onlineQuestions = this.onlineQuestions.concat(newQuestions);

            this.questions = this.onlineQuestions;
            this.onlineCurrentQuestion++;
            this.currentQuestion = this.onlineCurrentQuestion;
            this.onlineHasAnswered = false;      // 新题目，重置已答状态
            this.onlineUserSelection = null;     // 新题目，重置用户选择

            // 隐藏反馈（UI 状态变为 IDLE）
            document.getElementById('feedback').classList.remove('show');
            document.getElementById('save-btn').style.display = 'none';

            // 渲染新题目
            this.renderQuestion();

        } catch (error) {
            console.error('Failed to generate more questions:', error);
            this.showToast(
                lang === 'zh' ? '生成失败，请稍后重试' : 'Failed to generate, please try again',
                'error'
            );
            nextBtn.textContent = originalText;
            nextBtn.disabled = false;
        }
    },

    // 重新渲染当前题目（语言切换时调用）
    refreshCurrentQuestion() {
        // 如果有题目，正常渲染（即使正在加载）
        if (this.questions && this.questions.length > 0 && this.currentQuestion < this.questions.length) {
            const lang = LanguageManager.getLang();
            const q = this.questions[this.currentQuestion];

            // 更新题目文本
            document.getElementById('question-text').textContent =
                typeof q.question === 'object' ? q.question[lang] : q.question;

            // 更新选项文本
            const container = document.getElementById('options-container');
            const optionLabels = ['A', 'B', 'C', 'D'];
            q.options.forEach((option, index) => {
                const btn = container.children[index];
                if (btn) {
                    const textSpan = btn.querySelector('span:last-child');
                    if (textSpan) {
                        textSpan.textContent = typeof option === 'object' ? option[lang] : option;
                    }
                }
            });

            // 如果已答题，更新反馈区域（包括文案）
            const feedback = document.getElementById('feedback');
            if (feedback.classList.contains('show')) {
                const userSelection = this.mode === 'local'
                    ? this.localUserSelection
                    : this.onlineUserSelection;
                const isCorrect = userSelection === q.answer;
                this.showFeedback(isCorrect, q);
            }

            // 更新按钮和完成提示
            this.updateCompleteMessage();
            return;
        }

        // 如果没有题目且正在加载，显示"加载中"
        if (this.isLoadingOnline) {
            document.getElementById('question-text').textContent = LanguageManager.t('quiz_loading');
        }
    },

    // 更新完成提示文字（语言切换时调用）
    updateCompleteMessage() {
        const completeContainer = document.getElementById('complete-message');
        const nextBtn = document.getElementById('next-btn');
        const saveBtn = document.getElementById('save-btn');
        const feedback = document.getElementById('feedback');
        const lang = LanguageManager.getLang();

        const hasAnswered = feedback.classList.contains('show');
        const isLastQuestion = this.currentQuestion >= this.questions.length - 1;

        if (!hasAnswered) {
            if (completeContainer) completeContainer.style.display = 'none';
            nextBtn.style.display = 'none';
            saveBtn.style.display = 'none';
            return;
        }

        if (isLastQuestion && this.mode === 'local') {
            if (completeContainer) {
                completeContainer.style.display = 'block';
                completeContainer.textContent = lang === 'zh' ? '✅ 题目已做完' : '✅ Quiz Complete';
            }
            nextBtn.style.display = 'none';
            saveBtn.style.display = 'none';
        } else if (this.mode === 'online') {
            if (completeContainer) completeContainer.style.display = 'none';
            saveBtn.style.display = 'block';
            nextBtn.style.display = 'block';
            if (isLastQuestion) {
                nextBtn.textContent = lang === 'zh' ? '📥 继续生成题目' : '📥 Generate More';
            } else {
                nextBtn.textContent = LanguageManager.t('btn_next');
            }
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    QuizManager.init();
});
