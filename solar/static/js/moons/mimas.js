/**
 * 土卫一 Mimas 纹理生成（赫歇尔撞击坑 + 死亡之星外观）
 * 灰色底色 + 赫歇尔大撞击坑 + 中央峰 + 100个小坑
 * 参照 solar-system 老代码
 */

import * as THREE from 'three';

export function createMimasTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 灰色底色
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#b0b0b0');
    gradient.addColorStop(0.5, '#c0c0c0');
    gradient.addColorStop(1, '#b0b0b0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 赫歇尔撞击坑（Herschel，占卫星直径1/3，让它看起来像死亡之星）
    ctx.fillStyle = '#909090';
    ctx.beginPath();
    ctx.arc(600, 260, 70, 0, Math.PI * 2);
    ctx.fill();
    // 撞击坑边缘描边
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(600, 260, 70, 0, Math.PI * 2);
    ctx.stroke();
    // 中央峰
    ctx.fillStyle = '#a0a0a0';
    ctx.beginPath();
    ctx.arc(600, 260, 20, 0, Math.PI * 2);
    ctx.fill();

    // 小型撞击坑
    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
    for (let i = 0; i < 100; i++) {
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
