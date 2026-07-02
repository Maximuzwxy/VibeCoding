// 天体选择器模块

import { initJupiterScene, clearJupiterScene } from './planets/jupiter.js';
import { initEarthScene, clearEarthScene } from './planets/earth.js';
import { initMarsScene, clearMarsScene } from './planets/mars.js';
import { initMercuryScene, clearMercuryScene } from './planets/mercury.js';
import { initVenusScene, clearVenusScene } from './planets/venus.js';
import { initUranusScene, clearUranusScene } from './planets/uranus.js';
import { initNeptuneScene, clearNeptuneScene } from './planets/neptune.js';
import { initSaturnScene, clearSaturnScene } from './planets/saturn.js';
import { initMoonScene, clearMoonScene } from './moons/moon.js';
import { initGanymedeScene, clearGanymedeScene } from './moons/ganymede.js';
import { initTitanScene, clearTitanScene } from './moons/titan.js';
import { initPhobosScene, clearPhobosScene } from './moons/phobos.js';
import { initDeimosScene, clearDeimosScene } from './moons/deimos.js';
import { initIoScene, clearIoScene } from './moons/io.js';
import { initEuropaScene, clearEuropaScene } from './moons/europa.js';
import { initCallistoScene, clearCallistoScene } from './moons/callisto.js';
import { initMimasScene, clearMimasScene } from './moons/mimas.js';
import { initEnceladusScene, clearEnceladusScene } from './moons/enceladus.js';
import { initGenericMoonScene, clearGenericMoonScene } from './moons/generic-moon.js';

const PlanetSelector = {
    currentPlanet: 'sun',  // 默认太阳（太阳系）
    currentPlanetData: null,  // 缓存当前行星数据

    // 所有卫星数据
    allMoons: [
        // 地球卫星
        { id: 'moon', name: { zh: '月球', en: 'Moon' }, color: '#cccccc', planet: 'earth' },
        // 火星卫星
        { id: 'phobos', name: { zh: '火卫一', en: 'Phobos' }, color: '#8b7355', planet: 'mars' },
        { id: 'deimos', name: { zh: '火卫二', en: 'Deimos' }, color: '#a0826d', planet: 'mars' },
        // 木星卫星
        { id: 'io', name: { zh: '木卫一', en: 'Io' }, color: '#dcc658', planet: 'jupiter' },
        { id: 'europa', name: { zh: '木卫二', en: 'Europa' }, color: '#c4b8a8', planet: 'jupiter' },
        { id: 'ganymede', name: { zh: '木卫三', en: 'Ganymede' }, color: '#a89888', planet: 'jupiter' },
        { id: 'callisto', name: { zh: '木卫四', en: 'Callisto' }, color: '#8a7f75', planet: 'jupiter' },
        // 土星卫星
        { id: 'mimas', name: { zh: '土卫一', en: 'Mimas' }, color: '#c0c0c0', planet: 'saturn' },
        { id: 'enceladus', name: { zh: '土卫二', en: 'Enceladus' }, color: '#d0d0d0', planet: 'saturn' },
        { id: 'tethys', name: { zh: '土卫三', en: 'Tethys' }, color: '#c8c8c8', planet: 'saturn' },
        { id: 'dione', name: { zh: '土卫四', en: 'Dione' }, color: '#b8b8b8', planet: 'saturn' },
        { id: 'rhea', name: { zh: '土卫五', en: 'Rhea' }, color: '#b0b0b0', planet: 'saturn' },
        { id: 'titan', name: { zh: '土卫六', en: 'Titan' }, color: '#d4b88c', planet: 'saturn' },
        { id: 'iapetus', name: { zh: '土卫八', en: 'Iapetus' }, color: '#a8a8a8', planet: 'saturn' },
        // 天王星卫星
        { id: 'miranda', name: { zh: '天卫一', en: 'Miranda' }, color: '#b8b8b8', planet: 'uranus' },
        { id: 'ariel', name: { zh: '天卫二', en: 'Ariel' }, color: '#c8c8c8', planet: 'uranus' },
        { id: 'titania', name: { zh: '天卫三', en: 'Titania' }, color: '#b0b8c0', planet: 'uranus' },
        { id: 'oberon', name: { zh: '天卫四', en: 'Oberon' }, color: '#a8b0b8', planet: 'uranus' },
        { id: 'umbriel', name: { zh: '天卫五', en: 'Umbriel' }, color: '#98a0a8', planet: 'uranus' },
        // 海王星卫星
        { id: 'triton', name: { zh: '海卫一', en: 'Triton' }, color: '#c8b8a8', planet: 'neptune' }
    ],

    // 初始化
    init() {
        this.bindEvents();
        this.bindLanguageChange();
        this.renderMoonsList();  // 生成卫星列表
    },

    // 生成卫星列表
    renderMoonsList() {
        const container = document.getElementById('moons-popup-content');
        const header = document.getElementById('moons-popup-header');
        if (!container) return;

        const lang = typeof LanguageManager !== 'undefined' ? LanguageManager.getLang() : 'zh';

        // 更新列表标题
        if (header) {
            header.textContent = lang === 'zh' ? '🌑 卫星列表' : '🌑 Moon List';
        }

        let html = '';
        this.allMoons.forEach(moon => {
            const name = lang === 'zh' ? moon.name.zh : moon.name.en;
            html += `
                <div class="moon-item" data-moon-id="${moon.id}" style="border-left: 3px solid ${moon.color}">
                    <div class="moon-sphere" style="background: radial-gradient(circle at 30% 30%, ${moon.color}, ${this.darkenColor(moon.color, 30)});"></div>
                    <div class="moon-name">${name}</div>
                </div>
            `;
        });

        container.innerHTML = html;

        // 绑定点击事件
        container.querySelectorAll('.moon-item').forEach(item => {
            item.addEventListener('click', () => {
                const moonId = item.getAttribute('data-moon-id');
                if (moonId) {
                    console.log('Loading moon:', moonId);
                    PlanetSelector.loadPlanet(moonId);
                }
            });
        });
    },

    // 颜色变暗
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) - amt, G = (num >> 8 & 0x00FF) - amt, B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    },

    // 绑定语言切换事件
    bindLanguageChange() {
        document.addEventListener('languageChanged', () => {
            this.refreshInfoPanel();
            this.renderMoonsList();  // 语言切换时重新生成卫星列表
        });
    },

    // 绑定事件
    bindEvents() {
        document.querySelectorAll('.planet-icon').forEach(icon => {
            // 卫星列表按钮不绑定点击事件
            if (icon.id === 'moons-list-btn') return;
            
            icon.addEventListener('click', (e) => {
                const planet = e.currentTarget.getAttribute('data-planet');
                this.selectPlanet(planet);
            });
        });
    },

    // 选择天体
    selectPlanet(planet) {
        // 更新激活状态
        document.querySelectorAll('.planet-icon').forEach(icon => {
            icon.classList.toggle('active', icon.getAttribute('data-planet') === planet);
        });

        // 更新当前天体
        this.currentPlanet = planet;

        // 切换主题
        this.applyTheme(planet);

        // 加载内容
        this.loadPlanetContent(planet);
    },

    // 应用主题色
    applyTheme(planet) {
        const icon = document.querySelector(`.planet-icon[data-planet="${planet}"]`);
        const color = icon?.getAttribute('data-color');
        
        if (color) {
            // 设置 CSS 变量
            document.documentElement.style.setProperty('--theme-color', color);
            
            // 计算 RGB
            const rgb = this.hexToRgb(color);
            document.documentElement.style.setProperty('--theme-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        }

        // 设置 data-theme 属性（用于预定义主题）
        document.documentElement.setAttribute('data-theme', planet);
    },

    // 十六进制转 RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {r: 255, g: 255, b: 255};
    },

    // 加载天体内容
    async loadPlanetContent(planet) {
        console.log('Loading planet:', planet);

        // 太阳：展现太阳系
        if (planet === 'sun') {
            await this.loadSolarSystem();
            return;
        }

        // 其他行星：加载对应的信息面板、题目和 3D 场景
        await this.loadPlanet(planet);
    },

    // 加载太阳系（点击太阳时）
    async loadSolarSystem() {
        // 清除所有行星和卫星场景
        clearJupiterScene();
        clearEarthScene();
        clearMarsScene();
        clearMercuryScene();
        clearVenusScene();
        clearUranusScene();
        clearNeptuneScene();
        clearSaturnScene();
        clearMoonScene();
        clearGanymedeScene();
        clearTitanScene();
        clearPhobosScene();
        clearDeimosScene();
        clearIoScene();
        clearEuropaScene();
        clearCallistoScene();
        clearMimasScene();
        clearEnceladusScene();
        clearGenericMoonScene();

        // 重置主题为默认
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.style.setProperty('--theme-color', '#ffdd00');
        document.documentElement.style.setProperty('--theme-color-rgb', '255, 221, 0');

        // 重新加载主页面
        window.location.href = '/';
    },

    // 加载行星/卫星
    async loadPlanet(planetId) {
        try {
            // 1. 先清除所有场景（释放资源）
            clearJupiterScene();
            clearEarthScene();
            clearMarsScene();
            clearMercuryScene();
            clearVenusScene();
            clearUranusScene();
            clearNeptuneScene();
            clearSaturnScene();
            clearMoonScene();
            clearGanymedeScene();
            clearTitanScene();

            // 2. 加载 3D 场景
            if (planetId === 'jupiter') {
                initJupiterScene();
            } else if (planetId === 'earth') {
                initEarthScene();
            } else if (planetId === 'mars') {
                initMarsScene();
            } else if (planetId === 'mercury') {
                initMercuryScene();
            } else if (planetId === 'venus') {
                initVenusScene();
            } else if (planetId === 'uranus') {
                initUranusScene();
            } else if (planetId === 'neptune') {
                initNeptuneScene();
            } else if (planetId === 'saturn') {
                initSaturnScene();
            } else if (planetId === 'moon') {
                initMoonScene();
            } else if (planetId === 'ganymede') {
                initGanymedeScene();
            } else if (planetId === 'titan') {
                initTitanScene();
            } else if (planetId === 'phobos') {
                initPhobosScene();
            } else if (planetId === 'deimos') {
                initDeimosScene();
            } else if (planetId === 'io') {
                initIoScene();
            } else if (planetId === 'europa') {
                initEuropaScene();
            } else if (planetId === 'callisto') {
                initCallistoScene();
            } else if (planetId === 'mimas') {
                initMimasScene();
            } else if (planetId === 'enceladus') {
                initEnceladusScene();
            } else if (planetId === 'tethys') {
                initGenericMoonScene('#c8c8c8', 0.6);
            } else if (planetId === 'dione') {
                initGenericMoonScene('#b8b8b8', 0.65);
            } else if (planetId === 'rhea') {
                initGenericMoonScene('#b0b0b0', 0.7);
            } else if (planetId === 'iapetus') {
                initGenericMoonScene('#a8a8a8', 0.68);
            } else if (planetId === 'miranda') {
                initGenericMoonScene('#b8b8b8', 0.55);
            } else if (planetId === 'ariel') {
                initGenericMoonScene('#c8c8c8', 0.67);
            } else if (planetId === 'titania') {
                initGenericMoonScene('#b0b8c0', 0.73);
            } else if (planetId === 'oberon') {
                initGenericMoonScene('#a8b0b8', 0.71);
            } else if (planetId === 'umbriel') {
                initGenericMoonScene('#98a0a8', 0.68);
            } else if (planetId === 'triton') {
                initGenericMoonScene('#c8b8a8', 0.8);
            }

            // 3. 加载数据（卫星从 moons 目录加载）
            let res;
            const isMoon = ['moon', 'ganymede', 'titan', 'phobos', 'deimos', 'io', 'europa', 'callisto', 'mimas', 'enceladus', 'tethys', 'dione', 'rhea', 'iapetus', 'miranda', 'ariel', 'titania', 'oberon', 'umbriel', 'triton'].includes(planetId);
            if (isMoon) {
                res = await fetch(`/api/data/moon/${planetId}`);
            } else {
                res = await fetch(`/api/data/planet/${planetId}`);
            }
            
            if (!res.ok) {
                throw new Error(`Planet ${planetId} not found`);
            }
            const planetData = await res.json();

            // 4. 缓存当前行星数据
            this.currentPlanetData = planetData;

            // 5. 渲染信息面板
            await this.renderInfoPanel(planetData);

            // 6. 加载题目
            await this.loadQuiz(planetId);

        } catch (error) {
            console.error('Failed to load planet:', error);
            alert(`加载${planetId}数据失败，请稍后重试`);
        }
    },

    // 刷新信息面板（语言切换时调用）
    refreshInfoPanel() {
        if (this.currentPlanetData) {
            this.renderInfoPanel(this.currentPlanetData);
        }
    },

    // 渲染信息面板
    async renderInfoPanel(data) {
        const container = document.getElementById('info-panel');
        const lang = typeof LanguageManager !== 'undefined' ? LanguageManager.getLang() : 'zh';
        const planetId = data.id;

        let html = `<h3>${data.icon} ${data.name[lang]}</h3>`;

        for (const section of data.info_sections) {
            html += `
                <div class="info-section">
                    <div class="info-section-title">${section.title[lang]}</div>
            `;

            if (section.items) {
                for (const item of section.items) {
                    const value = typeof item.value === 'object'
                        ? (item.value[lang] || item.value.zh)
                        : item.value;

                    html += `
                        <div class="info-item">
                            <span class="info-label">${item.label[lang]}</span>
                            <span class="info-value">${value}</span>
                        </div>
                    `;
                }
            }

            html += `</div>`;

            // 备注
            if (section.note) {
                const noteValue = typeof section.note === 'object'
                    ? (section.note[lang] || section.note.zh)
                    : section.note;
                html += `<div class="info-note">${noteValue}</div>`;
            }

            // 卫星列表（如果有）- 卫星详情
            if (section.moons_list) {
                // 根据行星类型显示不同的标题
                let moonsTitle = lang === 'zh' ? '卫星详情' : 'Moons Details';
                if (planetId === 'jupiter') {
                    moonsTitle = lang === 'zh' ? '伽利略卫星详情' : 'Galilean Moons Details';
                } else if (planetId === 'mars') {
                    moonsTitle = lang === 'zh' ? '火星卫星详情' : 'Martian Moons Details';
                } else if (planetId === 'saturn') {
                    moonsTitle = lang === 'zh' ? '土星卫星详情' : 'Saturn Moons Details';
                } else if (planetId === 'earth') {
                    moonsTitle = lang === 'zh' ? '月球详情' : 'Moon Details';
                }

                html += `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(216, 202, 157, 0.2);">
                        <div style="color: var(--accent-color); font-size: 10px; font-weight: bold; margin-bottom: 8px;">
                            ${moonsTitle}
                        </div>
                `;
                for (const moon of section.moons_list) {
                    const moonName = typeof moon.name === 'object' ? (moon.name[lang] || moon.name.zh) : moon.name;
                    const moonPeriod = typeof moon.period === 'object' ? (moon.period[lang] || moon.period.zh) : moon.period;

                    // 根据卫星名称确定 moonId
                    let moonId = '';
                    if (moonName.includes('月球') || moonName.includes('Moon')) moonId = 'moon';
                    else if (moonName.includes('木卫三') || moonName.includes('Ganymede')) moonId = 'ganymede';
                    else if (moonName.includes('土卫六') || moonName.includes('Titan')) moonId = 'titan';
                    else if (moonName.includes('火卫一') || moonName.includes('Phobos')) moonId = 'phobos';
                    else if (moonName.includes('火卫二') || moonName.includes('Deimos')) moonId = 'deimos';
                    else if (moonName.includes('木卫一') || moonName.includes('Io')) moonId = 'io';
                    else if (moonName.includes('木卫二') || moonName.includes('Europa')) moonId = 'europa';
                    else if (moonName.includes('木卫四') || moonName.includes('Callisto')) moonId = 'callisto';
                    else if (moonName.includes('土卫一') || moonName.includes('Mimas')) moonId = 'mimas';
                    else if (moonName.includes('土卫二') || moonName.includes('Enceladus')) moonId = 'enceladus';
                    else if (moonName.includes('土卫三') || moonName.includes('Tethys')) moonId = 'tethys';
                    else if (moonName.includes('土卫四') || moonName.includes('Dione')) moonId = 'dione';
                    else if (moonName.includes('土卫五') || moonName.includes('Rhea')) moonId = 'rhea';
                    else if (moonName.includes('土卫八') || moonName.includes('Iapetus')) moonId = 'iapetus';
                    else if (moonName.includes('天卫一') || moonName.includes('Miranda')) moonId = 'miranda';
                    else if (moonName.includes('天卫二') || moonName.includes('Ariel')) moonId = 'ariel';
                    else if (moonName.includes('天卫三') || moonName.includes('Titania')) moonId = 'titania';
                    else if (moonName.includes('天卫四') || moonName.includes('Oberon')) moonId = 'oberon';
                    else if (moonName.includes('天卫五') || moonName.includes('Umbriel')) moonId = 'umbriel';
                    else if (moonName.includes('海卫一') || moonName.includes('Triton')) moonId = 'triton';

                    // 添加点击事件
                    const isClickable = moonId ? 'cursor: pointer;' : '';

                    html += `
                        <div class="info-item" style="margin-bottom: 4px; ${isClickable}" ${moonId ? 'data-moon-id="' + moonId + '"' : ''}>
                            <span class="info-label" style="font-weight: normal;">
                                ${moonName}
                                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${moon.color}; display: inline-block; vertical-align: middle; margin-left: 4px;"></div>
                            </span>
                            <span class="info-value" style="font-size: 10px;">${moonPeriod}</span>
                        </div>
                    `;
                }
                html += `</div>`;
            }
        }

        container.innerHTML = html;
        
        // 添加卫星点击事件监听
        setTimeout(() => {
            container.querySelectorAll('[data-moon-id]').forEach(item => {
                item.addEventListener('click', (e) => {
                    const moonId = item.getAttribute('data-moon-id');
                    if (moonId) {
                        console.log('Loading moon:', moonId);
                        this.loadPlanet(moonId);
                    }
                });
            });
        }, 10);
    },

    // 选择卫星（从行星页面或卫星列表点击进入卫星）
    selectMoon(moonId) {
        console.log('Loading moon:', moonId);
        this.loadPlanet(moonId);
    },

    // 加载题目
    async loadQuiz(planetId) {
        // 通知 QuizManager 切换题库
        if (typeof QuizManager !== 'undefined') {
            QuizManager.setTopic(planetId);
            await QuizManager.loadQuiz('local');
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    PlanetSelector.init();
});
