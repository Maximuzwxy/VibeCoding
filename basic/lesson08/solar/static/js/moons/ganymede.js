/**
 * 木卫三 Ganymede 纹理生成（太阳系最大卫星，冰岩混合）
 * 灰褐色底色 + 暗色古老区域 + 亮色年轻区域 + 沟槽地形 + 撞击坑 + 冰层裂缝
 * 参照 solar-system 老代码
 */

import * as THREE from 'three';

export function createGanymedeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 灰褐色冰岩混合底色
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#9a8a7a');
    gradient.addColorStop(0.5, '#a89888');
    gradient.addColorStop(1, '#9a8a7a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 暗色古老区域（撞击坑密集，约覆盖 30%）
    ctx.fillStyle = '#7a6a5a';
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 100 + 50;
        const ry = Math.random() * 80 + 40;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. 亮色年轻区域（沟槽地形）
    ctx.fillStyle = '#b8a898';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 150 + 80;
        const ry = Math.random() * 60 + 30;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. 沟槽地形（平行线条，Ganymede 典型特征）
    ctx.strokeStyle = '#c8b8a8';
    ctx.lineWidth = 3;
    for (let i = 0; i < 30; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        const length = Math.random() * 200 + 100;
        const angle = Math.random() * Math.PI;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(
            startX + Math.cos(angle) * length,
            startY + Math.sin(angle) * length
        );
        ctx.stroke();
    }

    // 4. 大型撞击坑（主撞击坑 + 按尺寸分布）
    ctx.fillStyle = '#8a7a6a';
    ctx.beginPath();
    ctx.arc(1000, 500, 80, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 40 + 20;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 5. 小型撞击坑（200 个随机坑）
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 15 + 3;
        const alpha = Math.random() * 0.3 + 0.1;
        ctx.fillStyle = `rgba(${100 + Math.random() * 40}, ${90 + Math.random() * 40}, ${80 + Math.random() * 40}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 6. 冰层裂缝（细线）
    ctx.strokeStyle = 'rgba(200, 190, 180, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 50; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        const length = Math.random() * 100 + 50;
        const angle = Math.random() * Math.PI;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(
            startX + Math.cos(angle) * length,
            startY + Math.sin(angle) * length
        );
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}
