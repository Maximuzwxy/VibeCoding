/**
 * 火星纹理生成
 * 红褐色底色 + 极冠冰盖 + 水手峡谷 + 奥林匹斯山 + 陨石坑 + 暗斑
 * 额外导出大气层纹理（淡橙色光晕）
 */

import * as THREE from 'three';

export function createMarsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 红褐色底色
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#c15a3a');
    gradient.addColorStop(0.5, '#b7410e');
    gradient.addColorStop(1, '#c15a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 北极冰盖
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.ellipse(1024, 60, 300, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    const iceCapGradient = ctx.createRadialGradient(1024, 60, 0, 1024, 60, 350);
    iceCapGradient.addColorStop(0, 'rgba(240, 240, 240, 0.9)');
    iceCapGradient.addColorStop(0.7, 'rgba(240, 240, 240, 0.5)');
    iceCapGradient.addColorStop(1, 'rgba(240, 240, 240, 0)');
    ctx.fillStyle = iceCapGradient;
    ctx.beginPath();
    ctx.ellipse(1024, 60, 350, 70, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. 南极冰盖（较小）
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.ellipse(1024, 970, 250, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. 水手峡谷（Valles Marineris）
    ctx.fillStyle = '#8b3a1e';
    ctx.beginPath();
    ctx.ellipse(1150, 520, 220, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. 奥林匹斯山（Olympus Mons）
    const olympusX = 550, olympusY = 320;
    ctx.fillStyle = '#8b3a1e';
    ctx.beginPath();
    ctx.arc(olympusX, olympusY, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b2a0e';
    ctx.beginPath();
    ctx.arc(olympusX, olympusY, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d46a4a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(olympusX, olympusY, 35, 0, Math.PI * 2);
    ctx.stroke();

    // 5. 陨石坑
    for (let i = 0; i < 150; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = Math.random() * 20 + 3;
        const alpha = Math.random() * 0.3 + 0.1;
        ctx.fillStyle = `rgba(139, 58, 30, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(180, 80, 50, ${alpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
    }

    // 6. 暗色区域
    ctx.fillStyle = 'rgba(101, 47, 23, 0.4)';
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.beginPath();
        ctx.ellipse(x, y, Math.random() * 60 + 20, Math.random() * 40 + 15, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}

/**
 * 火星稀薄大气层纹理（极淡橙色光晕）
 */
export function createMarsAtmosphereTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(256, 128, 0, 256, 128, 256);
    gradient.addColorStop(0, 'rgba(193, 90, 58, 0.05)');
    gradient.addColorStop(0.8, 'rgba(193, 90, 58, 0.02)');
    gradient.addColorStop(1, 'rgba(193, 90, 58, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}
