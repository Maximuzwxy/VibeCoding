/**
 * 木卫一 Io 纹理生成（太阳系火山活动最剧烈的天体）
 * 硫磺黄色底色 + 橙色硫磺沉积 + 红色火山区域 + 暗色火山口 + 白色喷发羽流 + 斑驳纹理
 * 参照 solar-system 老代码
 */

import * as THREE from 'three';

export function createIoTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 硫磺黄色底色
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#dcc658');
    gradient.addColorStop(0.3, '#e8d068');
    gradient.addColorStop(0.5, '#dcc658');
    gradient.addColorStop(0.7, '#e8d068');
    gradient.addColorStop(1, '#dcc658');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 橙色区域（硫磺沉积）
    ctx.fillStyle = 'rgba(220, 140, 60, 0.5)';
    for (let i = 0; i < 60; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 150 + 80;
        const ry = Math.random() * 100 + 50;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. 红色区域（火山活动）
    ctx.fillStyle = 'rgba(180, 60, 40, 0.4)';
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 100 + 50;
        const ry = Math.random() * 70 + 30;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. 暗色火山口
    ctx.fillStyle = 'rgba(60, 40, 30, 0.5)';
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 60 + 20;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 4. 火山喷发羽流（白色亮点）
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 30 + 10;
        const plume = ctx.createRadialGradient(x, y, 0, x, y, radius);
        plume.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
        plume.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.fillStyle = plume;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 5. 表面斑驳纹理
    for (let i = 0; i < 500; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 4 + 1;
        const alpha = Math.random() * 0.3 + 0.1;
        const color = Math.random() > 0.5 ? '200, 160, 80' : '180, 100, 60';
        ctx.fillStyle = `rgba(${color}, ${alpha})`;
        ctx.fillRect(x, y, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}
