/**
 * 木卫四 Callisto 纹理生成（太阳系最古老、撞击坑最多的表面）
 * 灰褐色底色 + 瓦尔哈拉撞击坑多环结构 + 大型撞击坑 + 400个小坑 + 斑驳纹理 + 暗色溅射纹
 * 参照 solar-system 老代码
 */

import * as THREE from 'three';

export function createCallistoTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 灰褐色古老表面底色
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#7a6f65');
    gradient.addColorStop(0.5, '#8a7f75');
    gradient.addColorStop(1, '#7a6f65');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 瓦尔哈拉撞击坑（Valhalla，多环结构，Callisto 最独特特征）
    const centerX = 1000, centerY = 500;
    ctx.strokeStyle = 'rgba(100, 90, 80, 0.5)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, 100 + i * 80, 0, Math.PI * 2);
        ctx.stroke();
    }
    // 中心暗区
    ctx.fillStyle = 'rgba(90, 80, 70, 0.6)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
    ctx.fill();

    // 2. 大型撞击坑（按位置分布）
    const largeCraters = [
        { x: 600, y: 400, r: 80 },
        { x: 1400, y: 350, r: 70 },
        { x: 500, y: 650, r: 60 },
        { x: 1500, y: 700, r: 75 },
        { x: 300, y: 300, r: 50 }
    ];
    largeCraters.forEach(crater => {
        ctx.fillStyle = 'rgba(70, 60, 50, 0.5)';
        ctx.beginPath();
        ctx.arc(crater.x, crater.y, crater.r, 0, Math.PI * 2);
        ctx.fill();
        // 撞击坑边缘描边
        ctx.strokeStyle = 'rgba(60, 50, 40, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(crater.x, crater.y, crater.r, 0, Math.PI * 2);
        ctx.stroke();
    });

    // 3. 密集小型撞击坑（Callisto 特征，撞满了）
    ctx.fillStyle = 'rgba(80, 70, 60, 0.4)';
    for (let i = 0; i < 400; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 20 + 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 4. 表面斑驳纹理（古老、退化）
    for (let i = 0; i < 600; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 4 + 1;
        const alpha = Math.random() * 0.3 + 0.1;
        const color = 90 + Math.random() * 40;
        ctx.fillStyle = `rgba(${color}, ${color - 10}, ${color - 20}, ${alpha})`;
        ctx.fillRect(x, y, size, size);
    }

    // 5. 暗色溅射纹（撞击溅射物，较远的散射条带）
    ctx.strokeStyle = 'rgba(60, 50, 40, 0.3)';
    ctx.lineWidth = 1;
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

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}
