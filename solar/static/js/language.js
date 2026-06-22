/**
 * LanguageManager - 多语言管理模块
 *
 * 单例模式，管理 zh/en 语言状态
 * 切换时通过 'languageChanged' 自定义事件通知所有面板刷新
 */

const LanguageManager = {
    _lang: 'zh',
    _listeners: [],

    init() {
        this._loadFromStorage();
        this._bindButton();
        this._updateButton();
    },

    // 从 localStorage 加载语言偏好
    _loadFromStorage() {
        try {
            const saved = localStorage.getItem('solar_lang');
            if (saved === 'zh' || saved === 'en') {
                this._lang = saved;
            }
        } catch (e) {
            // localStorage 不可用时忽略
        }
    },

    // 保存到 localStorage
    _saveToStorage() {
        try {
            localStorage.setItem('solar_lang', this._lang);
        } catch (e) {
            // 忽略
        }
    },

    // 绑定 CN/EN 按钮
    _bindButton() {
        const btn = document.getElementById('lang-switch');
        if (!btn) return;

        btn.addEventListener('click', () => {
            this.toggle();
        });
    },

    // 更新按钮文字
    _updateButton() {
        const btn = document.getElementById('lang-switch');
        if (!btn) return;
        btn.textContent = this._lang === 'zh' ? 'CN' : 'EN';
    },

    // 获取当前语言
    getLang() {
        return this._lang;
    },

    // 切换语言
    toggle() {
        this._lang = this._lang === 'zh' ? 'en' : 'zh';
        this._saveToStorage();
        this._updateButton();

        // 通知所有监听面板
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { lang: this._lang }
        }));
    },

    // 根据语言取双语字段的值
    t(bilingual) {
        if (!bilingual) return '';
        if (typeof bilingual === 'string') return bilingual;
        return bilingual[this._lang] || bilingual.zh || '';
    }
};

// 模块加载时自动初始化
document.addEventListener('DOMContentLoaded', () => {
    LanguageManager.init();
});
