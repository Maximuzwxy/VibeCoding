/**
 * 火卫二 Deimos 纹理生成（灰褐色小表面、光滑撞击坑、微纹理）
 * 参照 solar-system 老代码
 */

import * as THREE from 'three';

export function createDeimosTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 灰褐色底色
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#90725d');
    gradient.addColorStop(0.5, '#a0826d');
    gradient.addColorStop(1, '#90725d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 撞击坑（Deimos 比 Phobos 更光滑，坑更少更大）
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 20 + 5;
        const alpha = Math.random() * 0.4 + 0.1;
        const r = Math.floor(80 + Math.random() * 30);
        const g = Math.floor(65 + Math.random() * 25);
        const b = Math.floor(50 + Math.random() * 20);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. 表面微纹理（粗糙颗粒，300像素）
    for (let i = 0; i < 300; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 3 + 1;
        const alpha = Math.random() * 0.3 + 0.1;
        const r = Math.floor(90 + Math.random() * 50);
        const g = Math.floor(75 + Math.random() * 40);
        const b = Math.floor(60 + Math.random() * 30);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fillRect(x, y, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}
