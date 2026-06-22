/**
 * 木卫二 Europa 纹理生成（冰壳覆盖、地下海洋）
 * 冰白浅褐色底色 + 冰裂纹网 + 平行脊线 + 暗色区域 + 亮色新鲜冰层 + 撞击坑
 * 参照 solar-system 老代码
 */

import * as THREE from 'three';

export function createEuropaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 冰白浅褐色底色
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#d4c8b8');
    gradient.addColorStop(0.3, '#e4d8c8');
    gradient.addColorStop(0.5, '#d4c8b8');
    gradient.addColorStop(0.7, '#e4d8c8');
    gradient.addColorStop(1, '#d4c8b8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 冰裂纹（深色线条，跨全球分布）
    ctx.strokeStyle = 'rgba(140, 120, 100, 0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 100; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        const length = Math.random() * 300 + 100;
        const angle = Math.random() * Math.PI;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(
            startX + Math.cos(angle) * length,
            startY + Math.sin(angle) * length
        );
        ctx.stroke();
    }

    // 2. 平行脊线（多组平行线条，Europa 典型特征）
    ctx.strokeStyle = 'rgba(160, 140, 120, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 80; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        const length = Math.random() * 200 + 80;
        const angle = Math.random() * Math.PI;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let j = 0; j < 5; j++) {
            ctx.lineTo(
                startX + Math.cos(angle) * (length + j * 10),
                startY + Math.sin(angle) * (length + j * 10)
            );
        }
        ctx.stroke();
    }

    // 3. 暗色区域（冰下物质露出）
    ctx.fillStyle = 'rgba(120, 100, 80, 0.3)';
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 100 + 50;
        const ry = Math.random() * 70 + 30;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 4. 亮色区域（新鲜冰层）
    ctx.fillStyle = 'rgba(240, 235, 225, 0.4)';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 80 + 40;
        const ry = Math.random() * 60 + 25;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 5. 小型撞击坑
    ctx.fillStyle = 'rgba(100, 90, 80, 0.4)';
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 15 + 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}
