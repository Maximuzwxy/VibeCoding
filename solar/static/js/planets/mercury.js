/**
 * 水星纹理生成
 * 卡洛里盆地 + 撞击坑 + 辐射纹 + 暗色平原
 */

import * as THREE from 'three';

export function createMercuryTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 水星基础颜色（灰色渐变）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#9a9a9a');
    gradient.addColorStop(0.5, '#b5b5b5');
    gradient.addColorStop(1, '#9a9a9a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 卡洛里盆地（Caloris Basin）- 最大撞击坑
    ctx.fillStyle = '#8a8a8a';
    ctx.beginPath();
    ctx.arc(1024, 520, 150, 0, Math.PI * 2);
    ctx.fill();

    // 卡洛里盆地边缘环形山
    ctx.strokeStyle = '#7a7a7a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(1024, 520, 150, 0, Math.PI * 2);
    ctx.stroke();

    // 内部同心环
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(1024, 520, 100, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(1024, 520, 50, 0, Math.PI * 2);
    ctx.stroke();

    // 2. 随机撞击坑
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = Math.random() * 30 + 5;
        const alpha = Math.random() * 0.3 + 0.1;

        ctx.fillStyle = `rgba(120, 120, 120, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(100, 100, 100, ${alpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();

        // 中心峰
        if (Math.random() > 0.7 && r > 15) {
            ctx.fillStyle = `rgba(140, 140, 140, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, r * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 3. 辐射纹
    for (let i = 0; i < 15; i++) {
        const cx = Math.random() * canvas.width;
        const cy = Math.random() * canvas.height;
        const numRays = Math.floor(Math.random() * 8) + 6;
        const rayLength = Math.random() * 80 + 40;

        ctx.strokeStyle = 'rgba(180, 180, 180, 0.3)';
        ctx.lineWidth = 1;

        for (let j = 0; j < numRays; j++) {
            const angle = (j / numRays) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * rayLength, cy + Math.sin(angle) * rayLength);
            ctx.stroke();
        }
    }

    // 4. 暗色区域（类似月海）
    ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 100 + 50;
        const ry = Math.random() * 80 + 40;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}
