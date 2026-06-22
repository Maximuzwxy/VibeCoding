// 多语言管理模块
const LanguageManager = {
    currentLang: 'zh',
    data: null,

    // 初始化
    async init() {
        this.loadFromStorage();
        await this.loadData();
        this.bindEvents();
        await this.loadInfoPanel();  // 加载信息面板 HTML
        this.updateUI();
        this.updatePlanetList();     // 更新行星列表
    },

    // 从 localStorage 加载语言偏好
    loadFromStorage() {
        const saved = localStorage.getItem('solar_system_lang');
        if (saved && (saved === 'zh' || saved === 'en')) {
            this.currentLang = saved;
        }
        this.updateLangButton();
    },

    // 保存到 localStorage
    saveToStorage() {
        localStorage.setItem('solar_system_lang', this.currentLang);
    },

    // 加载 JSON 数据
    async loadData() {
        try {
            const res = await fetch('/api/data/solar_system');
            this.data = await res.json();
        } catch (error) {
            console.error('Failed to load solar system data:', error);
        }
    },

    // 绑定事件
    bindEvents() {
        document.getElementById('lang-switch').addEventListener('click', () => {
            this.toggle();
        });
    },

    // 切换语言
    toggle() {
        this.currentLang = this.currentLang === 'zh' ? 'en' : 'zh';
        this.saveToStorage();
        this.updateLangButton();
        this.updateUI();
        this.updatePlanetList();

        // 触发自定义事件，通知其他模块语言已切换
        document.dispatchEvent(new CustomEvent('languageChanged'));
    },

    // 更新天体选择器文本
    updatePlanetSelector() {
        document.querySelectorAll('.planet-name-label[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });
    },

    // 加载信息面板 HTML
    async loadInfoPanel() {
        try {
            const res = await fetch('/static/templates/info-panel-solar.html');
            const html = await res.text();
            const container = document.getElementById('info-panel');
            if (container) {
                container.innerHTML = html;
            }
        } catch (error) {
            console.error('Failed to load info panel:', error);
        }
    },

    // 更新语言按钮显示
    updateLangButton() {
        const btn = document.getElementById('lang-switch');
        btn.textContent = this.currentLang === 'zh' ? 'CN' : 'EN';
    },

    // 更新所有 UI 文本
    updateUI() {
        if (!this.data) return;

        // 更新页面标题
        document.title = this.t('page_title');

        // 更新所有带 data-i18n 属性的元素
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });

        // 更新所有带 data-i18n-placeholder 属性的元素
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });

        // 更新所有带 data-i18n-content 属性的元素（只更新内容，不更新整个元素）
        document.querySelectorAll('[data-i18n-content]').forEach(el => {
            const key = el.getAttribute('data-i18n-content');
            el.textContent = this.t(key);
        });

        // 更新行星列表
        this.updatePlanetList();

        // 更新天体选择器文本
        this.updatePlanetSelector();

        // 刷新答题面板（如果正在答题）
        // 注意：只更新文本，不清空缓存
        if (typeof QuizManager !== 'undefined' && QuizManager.questions && QuizManager.questions.length > 0) {
            QuizManager.refreshCurrentQuestion();
            // 更新完成提示文字
            QuizManager.updateCompleteMessage();
        }
    },

    // 更新行星列表
    updatePlanetList() {
        const container = document.getElementById('planet-list');
        if (!container || !this.data?.planets?.list) return;

        container.innerHTML = this.data.planets.list.map(planet => `
            <div class="planet-item">
                <div class="planet-dot" style="background: ${planet.color}"></div>
                <span class="planet-name">${planet.name[this.currentLang]}</span>
            </div>
        `).join('');
    },

    // 翻译函数
    t(key) {
        const translations = {
            // 页面标题
            'page_title': this.currentLang === 'zh' ? '🌌 太阳系 - Solar System' : '🌌 Solar System',

            // 按钮
            'btn_toggle': this.currentLang === 'zh' ? '暂停/播放' : 'Pause/Play',
            'btn_send': this.currentLang === 'zh' ? '发送' : 'Send',
            'btn_next': this.currentLang === 'zh' ? '⏭ 下一题' : '⏭ Next',
            'btn_restart': this.currentLang === 'zh' ? '🔄 重新开始' : '🔄 Restart',
            'btn_save_to_bank': this.currentLang === 'zh' ? '💾 加入题库' : '💾 Save to Bank',
            'btn_local_complete': this.currentLang === 'zh' ? '🎉 本地题库已做完' : '🎉 Local Quiz Complete',
            'btn_online_complete': this.currentLang === 'zh' ? '🎉 在线题目已做完' : '🎉 Online Quiz Complete',

            // 聊天
            'chat_title': this.currentLang === 'zh' ? '🤖 太阳系探索助手' : '🤖 Solar System Explorer',
            'chat_welcome': this.currentLang === 'zh' ? '你好！我是太阳系探索助手。🌌 有什么关于太阳系的问题吗？' : 'Hello! I\'m your Solar System explorer assistant. 🌌 Any questions about the Solar System?',
            'chat_input_placeholder': this.currentLang === 'zh' ? '输入你的问题...' : 'Enter your question...',
            'search_placeholder': this.currentLang === 'zh' ? '输入问题，探索太阳系...' : 'Enter a question to explore the Solar System...',

            // 信息面板标题
            'title_solar_system': this.currentLang === 'zh' ? '🌌 太阳系' : '🌌 Solar System',
            'section_basic': this.currentLang === 'zh' ? '📊 基本信息' : '📊 Basic Information',
            'section_sun': this.currentLang === 'zh' ? '☀️ 太阳' : '☀️ The Sun',
            'section_planets': this.currentLang === 'zh' ? '🪐 八大行星' : '🪐 Eight Planets',
            'section_other': this.currentLang === 'zh' ? '☄️ 其他天体' : '☄️ Other Bodies',
            'section_exploration': this.currentLang === 'zh' ? '🚀 探索历史' : '🚀 Exploration History',

            // 行星名称（天体选择器）
            'planet_sun': this.currentLang === 'zh' ? '☀️ 太阳' : '☀️ Sun',
            'planet_mercury': this.currentLang === 'zh' ? '☿️ 水星' : '☿️ Mercury',
            'planet_venus': this.currentLang === 'zh' ? '♀️ 金星' : '♀️ Venus',
            'planet_earth': this.currentLang === 'zh' ? '🌍 地球' : '🌍 Earth',
            'planet_mars': this.currentLang === 'zh' ? '♂️ 火星' : '♂️ Mars',
            'planet_jupiter': this.currentLang === 'zh' ? '♃ 木星' : '♃ Jupiter',
            'planet_saturn': this.currentLang === 'zh' ? '🪐 土星' : '🪐 Saturn',
            'planet_uranus': this.currentLang === 'zh' ? '♅ 天王星' : '♅ Uranus',
            'planet_neptune': this.currentLang === 'zh' ? '♆ 海王星' : '♆ Neptune',
            'planet_solar_system': this.currentLang === 'zh' ? '🌌 太阳系' : '🌌 Solar System',

            // 基本信息
            'label_formation': this.currentLang === 'zh' ? '形成时间' : 'Formation Time',
            'value_formation': this.currentLang === 'zh' ? '46 亿年前' : '4.6 billion years ago',
            'label_location': this.currentLang === 'zh' ? '位置' : 'Location',
            'value_location': this.currentLang === 'zh' ? '银河系猎户臂' : 'Orion Arm, Milky Way',
            'label_distance': this.currentLang === 'zh' ? '距银河中心' : 'Distance to Galactic Center',
            'value_distance': this.currentLang === 'zh' ? '2.6 万光年' : '26,000 light years',
            'label_orbital_period': this.currentLang === 'zh' ? '公转周期' : 'Orbital Period',
            'value_orbital_period': this.currentLang === 'zh' ? '2.3 亿年' : '230 million years',
            'label_orbital_speed': this.currentLang === 'zh' ? '公转速度' : 'Orbital Speed',
            'value_orbital_speed': this.currentLang === 'zh' ? '220 km/s' : '220 km/s',

            // 太阳
            'label_type': this.currentLang === 'zh' ? '类型' : 'Type',
            'value_type': this.currentLang === 'zh' ? '黄矮星' : 'G-type main-sequence star',
            'label_diameter': this.currentLang === 'zh' ? '直径' : 'Diameter',
            'value_diameter': this.currentLang === 'zh' ? '1,392,700 km' : '1,392,700 km',
            'label_mass': this.currentLang === 'zh' ? '质量' : 'Mass',
            'value_mass': this.currentLang === 'zh' ? '1.989×10³⁰kg' : '1.989×10³⁰kg',
            'label_surface_temp': this.currentLang === 'zh' ? '表面温度' : 'Surface Temperature',
            'value_surface_temp': this.currentLang === 'zh' ? '5,500°C' : '5,500°C',
            'label_core_temp': this.currentLang === 'zh' ? '核心温度' : 'Core Temperature',
            'value_core_temp': this.currentLang === 'zh' ? '1,500 万°C' : '15 million°C',
            'note_sun_mass': this.currentLang === 'zh' ? '※ 占太阳系总质量的 99.86%' : '※ Contains 99.86% of Solar System\'s mass',

            // 行星
            'label_terrestrial': this.currentLang === 'zh' ? '类地行星' : 'Terrestrial Planets',
            'value_terrestrial': this.currentLang === 'zh' ? '4 颗' : '4',
            'label_gas_giant': this.currentLang === 'zh' ? '气态巨行星' : 'Gas Giants',
            'value_gas_giant': this.currentLang === 'zh' ? '4 颗' : '4',
            'label_moons': this.currentLang === 'zh' ? '已知卫星' : 'Known Moons',
            'value_moons': this.currentLang === 'zh' ? '290+ 颗' : '290+',

            // 其他天体
            'label_asteroid_belt': this.currentLang === 'zh' ? '小行星带' : 'Asteroid Belt',
            'value_asteroid_belt': this.currentLang === 'zh' ? '火星 - 木星间' : 'Between Mars and Jupiter',
            'label_kuiper_belt': this.currentLang === 'zh' ? '柯伊伯带' : 'Kuiper Belt',
            'value_kuiper_belt': this.currentLang === 'zh' ? '海王星轨道外' : 'Beyond Neptune',
            'label_dwarf_planets': this.currentLang === 'zh' ? '矮行星' : 'Dwarf Planets',
            'value_dwarf_planets': this.currentLang === 'zh' ? '5 颗确认' : '5 Confirmed',
            'label_comets': this.currentLang === 'zh' ? '彗星' : 'Comets',
            'value_comets': this.currentLang === 'zh' ? '数千颗' : 'Thousands',
            'note_pluto': this.currentLang === 'zh' ? '※ 冥王星是最大矮行星' : '※ Pluto is the largest dwarf planet',

            // 探索历史
            'label_first_satellite': this.currentLang === 'zh' ? '第一颗人造卫星' : 'First Satellite',
            'value_first_satellite': this.currentLang === 'zh' ? '1957 年' : '1957',
            'label_moon_landing': this.currentLang === 'zh' ? '首次登月' : 'Moon Landing',
            'value_moon_landing': this.currentLang === 'zh' ? '1969 年阿波罗 11 号' : '1969 Apollo 11',
            'label_voyager': this.currentLang === 'zh' ? '旅行者号' : 'Voyager',
            'value_voyager': this.currentLang === 'zh' ? '1977 年发射' : 'Launched 1977',
            'label_current_missions': this.currentLang === 'zh' ? '当前任务' : 'Current Missions',
            'value_current_missions': this.currentLang === 'zh' ? '多个进行中' : 'Multiple Ongoing',

            // 答题面板
            'quiz_title': this.currentLang === 'zh' ? '📝 太阳系知识挑战' : '📝 Solar System Quiz',
            'quiz_mode_local': this.currentLang === 'zh' ? '本地题库' : 'Local Quiz',
            'quiz_mode_online': this.currentLang === 'zh' ? '在线生成' : 'Online Generated',
            'quiz_loading': this.currentLang === 'zh' ? '加载中...' : 'Loading...',
            'quiz_complete_title': this.currentLang === 'zh' ? '🎉 挑战完成!' : '🎉 Quiz Complete!',
            'quiz_score': this.currentLang === 'zh' ? '得分：' : 'Score: ',

            // 卫星列表
            'moons_list': this.currentLang === 'zh' ? '🌑 卫星列表' : '🌑 Moons',
            'moons_list_title': this.currentLang === 'zh' ? '🌑 卫星列表 / Moons' : '🌑 Moons List'
        };

        return translations[key] || key;
    },

    // 获取当前语言
    getLang() {
        return this.currentLang;
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    LanguageManager.init();
});
