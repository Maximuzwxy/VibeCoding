/**
 * 天王星纹理生成（冰巨行星）
 * 青蓝色渐变底色 + 20条大气带 + 80个云层 + 极地区域 + 20个暗色风暴斑
 * 参照 solar-system 项目优化
 */

import * as THREE from 'three';

export function createUranusTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 青蓝色渐变底色（7段，比参照代码更丰富）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#6dd5ed');
    gradient.addColorStop(0.16, '#5bc0de');
    gradient.addColorStop(0.33, '#4fd0e7');
    gradient.addColorStop(0.5, '#58c8e2');
    gradient.addColorStop(0.66, '#5bc0de');
    gradient.addColorStop(0.83, '#4fc8e0');
    gradient.addColorStop(1, '#6dd5ed');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 大气带（横向条纹，极淡青蓝色，模拟甲烷吸收特征）
    for (let i = 0; i < 20; i++) {
        const y = (canvas.height / 20) * i;
        const height = Math.random() * 30 + 15;
        const alpha = Math.random() * 0.15 + 0.05;
        const blueShift = Math.floor(Math.random() * 60);
        ctx.fillStyle = `rgba(${80 + blueShift}, ${190 + blueShift / 2}, ${210 + blueShift / 2}, ${alpha})`;
        ctx.fillRect(0, y, canvas.width, height);
    }

    // 2. 淡色云层（青白色径向渐变斑点）
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 80 + 40;
        const alpha = Math.random() * 0.2 + 0.05;
        const cloudGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        cloudGradient.addColorStop(0, `rgba(180, 230, 240, ${alpha})`);
        cloudGradient.addColorStop(1, 'rgba(180, 230, 240, 0)');
        ctx.fillStyle = cloudGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. 北极区域（稍暗的青蓝色）
    const np = ctx.createRadialGradient(1024, 50, 0, 1024, 50, 300);
    np.addColorStop(0, 'rgba(60, 150, 180, 0.3)');
    np.addColorStop(1, 'rgba(60, 150, 180, 0)');
    ctx.fillStyle = np;
    ctx.beginPath();
    ctx.ellipse(1024, 50, 400, 150, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. 南极区域
    const sp = ctx.createRadialGradient(1024, 974, 0, 1024, 974, 300);
    sp.addColorStop(0, 'rgba(60, 150, 180, 0.3)');
    sp.addColorStop(1, 'rgba(60, 150, 180, 0)');
    ctx.fillStyle = sp;
    ctx.beginPath();
    ctx.ellipse(1024, 974, 400, 150, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5. 暗色风暴斑点（比参照代码更多，分布更自然）
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 60 + 30;
        const ry = Math.random() * 40 + 20;
        const alpha = Math.random() * 0.15 + 0.05;
        ctx.fillStyle = `rgba(60, 140, 160, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}

/**
 * 天王星大气层纹理（极淡青蓝色光晕）
 */
export function createUranusAtmosphereTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(256, 128, 0, 256, 128, 256);
    gradient.addColorStop(0, 'rgba(100, 220, 240, 0.10)');
    gradient.addColorStop(0.8, 'rgba(100, 220, 240, 0.05)');
    gradient.addColorStop(1, 'rgba(100, 220, 240, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}
