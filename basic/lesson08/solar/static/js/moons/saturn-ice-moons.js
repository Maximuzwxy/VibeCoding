/**
 * 通用土星冰卫星纹理生成
 * 用于 Tethys、Dione、Rhea、Iapetus（颜色相近的灰色冰卫星）
 * 灰色底色 + 冰裂缝 + 撞击坑 + 亮色光斑
 * 参数 color: 底色色系选择（'light' | 'medium' | 'dark'）
 */

import * as THREE from 'three';

export function createSaturnIceMoonTexture(colorStyle = 'medium') {
    const colorMap = {
        light:   { base: '#d0d0d0', mid: '#c8c8c8', dark: '#b0b0b0' },  // Tethys
        medium:  { base: '#c0c0c0', mid: '#b8b8b8', dark: '#a0a0a0' },  // Dione
        dark:    { base: '#b0b0b0', mid: '#a8a8a8', dark: '#909090' },  // Rhea
        twoface: { base: '#b0b0b0', mid: '#a0a0a0', dark: '#707070' }   // Iapetus
    };
    const c = colorMap[colorStyle] || colorMap.medium;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 灰色冰壳底色
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, c.base);
    gradient.addColorStop(0.5, c.mid);
    gradient.addColorStop(1, c.base);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Iapetus 双色特征：一半亮一半暗
    if (colorStyle === 'twoface') {
        ctx.fillStyle = c.dark;
        ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
    }

    // 1. 冰裂缝线
    ctx.strokeStyle = `rgba(150, 150, 150, 0.5)`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
        const sx = Math.random() * canvas.width;
        const sy = Math.random() * canvas.height;
        const length = Math.random() * 150 + 50;
        const angle = Math.random() * Math.PI;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(angle) * length, sy + Math.sin(angle) * length);
        ctx.stroke();
    }

    // 2. 撞击坑
    ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 20 + 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. 亮色光斑
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 30 + 10;
        const shine = ctx.createRadialGradient(x, y, 0, x, y, radius);
        shine.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = shine;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}
