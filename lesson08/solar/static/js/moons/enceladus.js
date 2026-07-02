/**
 * 土卫二 Enceladus 纹理生成（冰壳覆盖、虎纹裂缝）
 * 亮白灰色底色 + 虎纹裂缝 + 光滑冰面光斑
 * 参照 solar-system 老代码
 */

import * as THREE from 'three';

export function createEnceladusTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 亮白冰壳底色
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#e0e0e0');
    gradient.addColorStop(0.5, '#f0f0f0');
    gradient.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 虎纹裂缝（Stripe fractures，暗色线条）
    ctx.strokeStyle = 'rgba(150, 145, 140, 0.7)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
        const y = 100 + Math.random() * 300;  // 集中在赤道
        const length = 200 + Math.random() * 500;
        const x = 100 + Math.random() * 600;
        ctx.beginPath();
        ctx.moveTo(x, y);
        // 多段折线
        ctx.lineTo(x + length * 0.3, y + (Math.random() - 0.5) * 60);
        ctx.lineTo(x + length * 0.6, y + (Math.random() - 0.5) * 40);
        ctx.lineTo(x + length, y + (Math.random() - 0.5) * 30);
        ctx.stroke();
    }

    // 2. 暗色裂缝区域
    ctx.fillStyle = 'rgba(180, 175, 170, 0.3)';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = Math.random() * 30 + 15;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. 光滑冰面光斑（Enceladus 反光率极高）
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 40 + 20;
        const shine = ctx.createRadialGradient(x, y, 0, x, y, radius);
        shine.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = shine;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}
