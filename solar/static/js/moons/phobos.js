/**
 * 火卫一 Phobos 纹理生成（灰褐色不规则体、斯蒂克尼撞击坑、密集沟槽）
 * 参照 solar-system 老代码
 */

import * as THREE from 'three';

export function createPhobosTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 灰褐色底色
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#7b6b55');
    gradient.addColorStop(0.5, '#8b7355');
    gradient.addColorStop(1, '#7b6b55');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 斯蒂克尼撞击坑（Stickney，最大撞击坑，占Phobos直径1/3）
    ctx.fillStyle = '#6b5b45';
    ctx.beginPath();
    ctx.arc(600, 260, 80, 0, Math.PI * 2);
    ctx.fill();
    // 撞击坑边缘
    ctx.strokeStyle = '#5b4b35';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(600, 260, 80, 0, Math.PI * 2);
    ctx.stroke();

    // 2. 密集小型撞击坑
    for (let i = 0; i < 150; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 25 + 5;
        const alpha = Math.random() * 0.4 + 0.1;
        const r = Math.floor(90 + Math.random() * 30);
        const g = Math.floor(75 + Math.random() * 25);
        const b = Math.floor(60 + Math.random() * 20);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. 沟槽（Phobos 特征性线性裂缝）
    ctx.strokeStyle = 'rgba(100, 85, 70, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 30; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        const length = Math.random() * 150 + 50;
        const angle = Math.random() * Math.PI;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(
            startX + Math.cos(angle) * length,
            startY + Math.sin(angle) * length
        );
        ctx.stroke();
    }

    // 4. 表面粗糙微纹理
    for (let i = 0; i < 500; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 3 + 1;
        const alpha = Math.random() * 0.3 + 0.1;
        const r = Math.floor(100 + Math.random() * 50);
        const g = Math.floor(85 + Math.random() * 40);
        const b = Math.floor(70 + Math.random() * 30);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fillRect(x, y, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}
