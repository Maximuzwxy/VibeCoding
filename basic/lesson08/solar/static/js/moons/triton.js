/**
 * 海卫一 Triton 纹理生成（氮冰表面、粉灰色哈密瓜地貌、暗色羽流区）
 * 粉灰色底色 + 哈密瓜裂纹 + 暗色区域 + 氮冰亮斑
 * 参照真实 Triton 照片特征
 */

import * as THREE from 'three';

export function createTritonTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 粉灰色氮冰底色（Triton 独特色调）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#d4c4b8');
    gradient.addColorStop(0.3, '#dcc8b8');
    gradient.addColorStop(0.5, '#d8c8bc');
    gradient.addColorStop(0.7, '#dcc8b8');
    gradient.addColorStop(1, '#d4c4b8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 哈密瓜地形（cantaloupe terrain）：Triton 最独特特征
    //    密集的圆形/椭圆凸起，像哈密瓜皮纹理
    ctx.strokeStyle = 'rgba(180, 160, 140, 0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 25 + 10;
        const ry = Math.random() * 25 + 10;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 185, 165, 0.3)';
        ctx.fill();
        ctx.stroke();
    }

    // 2. 暗色氮冰羽流区（暗色斑块，主要在极地）
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const y = 100 + Math.random() * 100;  // 集中在极地区域
        const r = Math.random() * 50 + 20;
        const plume = ctx.createRadialGradient(x, y, 0, x, y, r);
        plume.addColorStop(0, 'rgba(140, 120, 100, 0.5)');
        plume.addColorStop(1, 'rgba(140, 120, 100, 0)');
        ctx.fillStyle = plume;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. 亮色氮冰（南部冰冠区域）
    for (let i = 0; i < 25; i++) {
        const x = Math.random() * canvas.width;
        const y = 360 + Math.random() * 120;  // 南半球
        const r = Math.random() * 60 + 30;
        const ice = ctx.createRadialGradient(x, y, 0, x, y, r);
        ice.addColorStop(0, 'rgba(240, 230, 220, 0.35)');
        ice.addColorStop(1, 'rgba(240, 230, 220, 0)');
        ctx.fillStyle = ice;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // 4. 撞击坑
    ctx.fillStyle = 'rgba(120, 100, 90, 0.4)';
    for (let i = 0; i < 60; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = Math.random() * 15 + 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // 5. 暗色线性裂缝
    ctx.strokeStyle = 'rgba(160, 140, 120, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
        const sx = Math.random() * canvas.width;
        const sy = Math.random() * canvas.height;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (Math.random() - 0.5) * 150, sy + (Math.random() - 0.5) * 150);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}
