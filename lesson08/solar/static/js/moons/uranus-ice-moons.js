/**
 * 通用冰卫星纹理生成 — 天王星 5 卫星
 * Miranda, Ariel, Umbriel, Titania, Oberon — 特征相近的冰岩混合体
 * 灰色冰岩底色 + 撞击坑 + 裂缝 + 暗色/亮色区域
 */

import * as THREE from 'three';

// 各卫星预定义色系
const PALETTES = {
    miranda: { base: '#c0c8d4', mid: '#b8c4d6', dark: '#a0a8b8' },
    ariel:   { base: '#d0d6dc', mid: '#c8d0d8', dark: '#b0b8c4' },
    umbriel: { base: '#a0a8b0', mid: '#98a0a8', dark: '#808890' },
    titania: { base: '#b8c0c8', mid: '#b0b8c0', dark: '#98a0a8' },
    oberon:  { base: '#b0b8c0', mid: '#a8b0b8', dark: '#9098a0' }
};

export function createUranusIceMoonTexture(moonId) {
    const palette = PALETTES[moonId] || PALETTES.titania;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 底色渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, palette.base);
    gradient.addColorStop(0.5, palette.mid);
    gradient.addColorStop(1, palette.base);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Miranda 特有：杂乱的拼贴地貌（chevrons patched terrain）
    if (moonId === 'miranda') {
        ctx.fillStyle = palette.dark;
        for (let i = 0; i < 20; i++) {
            const cx = Math.random() * canvas.width;
            const cy = Math.random() * canvas.height;
            const s = Math.random() * 60 + 30;
            ctx.beginPath();
            ctx.moveTo(cx - s, cy - s * 0.5);
            ctx.lineTo(cx, cy + s * 0.5);
            ctx.lineTo(cx + s, cy - s * 0.5);
            ctx.closePath();
            ctx.fill();
        }
    }

    // Umbriel 特有：极暗表面 + 亮色撞击坑边缘
    if (moonId === 'umbriel') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 1. 撞击坑（普遍特征）
    ctx.fillStyle = 'rgba(80, 80, 90, 0.4)';
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = Math.random() * 25 + 3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. 冰裂缝线
    ctx.strokeStyle = palette.dark;
    ctx.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
        const sx = Math.random() * canvas.width;
        const sy = Math.random() * canvas.height;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (Math.random() - 0.5) * 200, sy + (Math.random() - 0.5) * 200);
        ctx.stroke();
    }

    // 3. 亮色冰斑
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = Math.random() * 30 + 10;
        const shine = ctx.createRadialGradient(x, y, 0, x, y, r);
        shine.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = shine;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}
