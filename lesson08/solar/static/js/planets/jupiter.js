/**
 * 木星纹理生成
 * 棕米色渐变底色 + 6条横条纹带 + 大红斑 + 涡流细节
 * 额外导出云层纹理（半透明白色斑块）
 */

import * as THREE from 'three';

export function createJupiterTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 基础渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#c9a86c');
    gradient.addColorStop(0.1, '#b8956a');
    gradient.addColorStop(0.2, '#a67c52');
    gradient.addColorStop(0.3, '#d4b896');
    gradient.addColorStop(0.4, '#c9a86c');
    gradient.addColorStop(0.5, '#b8956a');
    gradient.addColorStop(0.6, '#a67c52');
    gradient.addColorStop(0.7, '#d4b896');
    gradient.addColorStop(0.8, '#c9a86c');
    gradient.addColorStop(0.9, '#b8956a');
    gradient.addColorStop(1, '#a67c52');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 条纹带
    const bands = [
        { y: 100, h: 80, color: 'rgba(139, 90, 43, 0.4)' },
        { y: 250, h: 60, color: 'rgba(160, 82, 45, 0.3)' },
        { y: 400, h: 100, color: 'rgba(139, 69, 19, 0.35)' },
        { y: 550, h: 70, color: 'rgba(160, 82, 45, 0.4)' },
        { y: 700, h: 90, color: 'rgba(139, 90, 43, 0.35)' },
        { y: 850, h: 60, color: 'rgba(160, 82, 45, 0.3)' }
    ];
    bands.forEach(b => { ctx.fillStyle = b.color; ctx.fillRect(0, b.y, canvas.width, b.h); });

    // 大红斑
    ctx.beginPath();
    ctx.ellipse(1700, 580, 80, 50, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(178, 34, 34, 0.6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 0, 0, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 涡流细节
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 20 + 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.2 + 0.1})`;
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}

/**
 * 木星云层纹理（半透明白色斑块）
 */
export function createJupiterCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 300; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 50 + 20;
        const alpha = Math.random() * 0.3 + 0.1;
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
        g.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        g.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}
