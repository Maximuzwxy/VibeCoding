/**
 * InfoPanel - 天体信息面板
 *
 * 纯 JS 动态渲染，fetch 数据 + 缓存 + 语言切换重渲染
 * 接口：load(celestialId) / setLanguage(lang) / clear()
 */

const InfoPanel = {
    _data: null,           // 缓存的天体数据
    _celestialId: null,    // 当前天体 ID
    _container: null,

    init(containerId) {
        this._container = document.getElementById(containerId);
        if (!this._container) return;

        // 监听语言切换
        document.addEventListener('languageChanged', () => {
            this._rerender();
        });
    },

    /**
     * 加载天体信息并渲染
     * @param {string} celestialId - 'solar_system' | 'mercury' | 'jupiter' | 'moon' ...
     */
    async load(celestialId) {
        this._celestialId = celestialId;
        try {
            const res = await fetch(`/api/data/celestial/${celestialId}`);
            if (!res.ok) throw new Error(`Celestial ${celestialId} not found`);
            this._data = await res.json();
            this._render();
        } catch (err) {
            console.error('InfoPanel load failed:', err);
            this._container.innerHTML = '<p style="color:#888;padding:20px;text-align:center;">Failed to load data</p>';
        }
    },

    // 语言切换时用缓存数据重新渲染
    _rerender() {
        if (this._data) {
            this._render();
        }
    },

    // 核心渲染
    _render() {
        if (!this._container || !this._data) return;

        const d = this._data;
        const lang = LanguageManager.getLang();
        let html = '';

        // 标题
        const icon = d.icon || '';
        const name = LanguageManager.t(d.name) || d.id || '';
        html += `<h3>${icon} ${name}</h3>`;

        // 逐个 section 渲染
        const sections = d.info_sections || [];
        for (const section of sections) {
            html += '<div class="info-section">';
            html += `<div class="info-section-title">${LanguageManager.t(section.title)}</div>`;

            // 条目
            const items = section.items || [];
            for (const item of items) {
                const label = LanguageManager.t(item.label);
                const value = LanguageManager.t(item.value);
                html += `
                    <div class="info-item">
                        <span class="info-label">${label}</span>
                        <span class="info-value">${value}</span>
                    </div>
                `;
            }

            html += '</div>';

            // 备注
            if (section.note) {
                html += `<div class="info-note">${LanguageManager.t(section.note)}</div>`;
            }
        }

        this._container.innerHTML = html;
    },

    // 清空面板
    clear() {
        if (this._container) {
            this._container.innerHTML = '';
        }
        this._data = null;
        this._celestialId = null;
    }
};
