/**
 * 金星纹理生成
 * 橙黄色云层带 + 极地漩涡 + 云带条纹 + 云团 + 暗带
 * 额外导出外层云罩（半透明球体，自转比表面快）
 */

import * as THREE from 'three';

export function createVenusTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 金星基础颜色（橙黄色云层）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#e6c87a');
    gradient.addColorStop(0.3, '#d4a95a');
    gradient.addColorStop(0.5, '#c49a4a');
    gradient.addColorStop(0.7, '#d4a95a');
    gradient.addColorStop(1, '#e6c87a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 浓厚云层（带状云纹）
    for (let i = 0; i < 30; i++) {
        const y = Math.random() * canvas.height;
        const height = Math.random() * 40 + 20;
        const alpha = Math.random() * 0.3 + 0.1;
        ctx.fillStyle = `rgba(255, 230, 180, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(Math.random() * canvas.width, y, Math.random() * 200 + 100, height, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. 极地漩涡（北半球）
    const vortex1X = 1024, vortex1Y = 150;
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(255, 240, 200, ${0.3 - i * 0.05})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(vortex1X, vortex1Y, 30 + i * 20, 0.2, Math.PI * 1.8);
        ctx.stroke();
    }

    // 极地漩涡（南半球）
    const vortex2X = 1024, vortex2Y = 874;
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(255, 240, 200, ${0.3 - i * 0.05})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(vortex2X, vortex2Y, 30 + i * 20, 0.2, Math.PI * 1.8);
        ctx.stroke();
    }

    // 3. 云带（横向条纹）
    for (let i = 0; i < 15; i++) {
        const y = (canvas.height / 15) * i;
        const height = Math.random() * 20 + 10;
        const alpha = Math.random() * 0.2 + 0.05;
        ctx.fillStyle = `rgba(220, 180, 120, ${alpha})`;
        ctx.fillRect(0, y, canvas.width, height);
    }

    // 4. 随机云团
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 50 + 20;
        const alpha = Math.random() * 0.25 + 0.05;
        const cg = ctx.createRadialGradient(x, y, 0, x, y, radius);
        cg.addColorStop(0, `rgba(255, 240, 200, ${alpha})`);
        cg.addColorStop(1, 'rgba(255, 240, 200, 0)');
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 5. 暗色区域（云层暗带）
    ctx.fillStyle = 'rgba(180, 140, 80, 0.15)';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 150 + 50;
        const ry = Math.random() * 30 + 15;
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
 * 外层云罩纹理（半透明，覆盖在金星表面之上）
 * 云罩比表面自转速度快
 */
export function createVenusCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 150; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 60 + 30;
        const alpha = Math.random() * 0.3 + 0.1;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(255, 245, 220, ${alpha})`);
        gradient.addColorStop(1, 'rgba(255, 245, 220, 0)');
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}
