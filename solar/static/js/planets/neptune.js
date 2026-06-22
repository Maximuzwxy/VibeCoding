/**
 * 海王星纹理生成（冰巨行星，太阳系最后一颗行星）
 * 深蓝色渐变底色 + 25条大气带 + 100个云层 + 大暗斑 + 35个白色风暴 + 25个暗色风暴 + 极地区域
 * 参照 solar-system 项目优化
 */

import * as THREE from 'three';

export function createNeptuneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 深蓝色渐变底色（7段，比参照代码更丰富）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#3366ff');
    gradient.addColorStop(0.16, '#2244ff');
    gradient.addColorStop(0.33, '#1a33cc');
    gradient.addColorStop(0.5, '#1e40e0');
    gradient.addColorStop(0.66, '#2244ff');
    gradient.addColorStop(0.83, '#1f38d4');
    gradient.addColorStop(1, '#3366ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 大气带（横向条纹，淡蓝色）
    for (let i = 0; i < 25; i++) {
        const y = (canvas.height / 25) * i;
        const height = Math.random() * 35 + 20;
        const alpha = Math.random() * 0.2 + 0.08;
        ctx.fillStyle = `rgba(100, 160, 255, ${alpha})`;
        ctx.fillRect(0, y, canvas.width, height);
    }

    // 2. 大暗斑（Great Dark Spot）- 中纬度椭圆形暗区
    ctx.fillStyle = 'rgba(30, 60, 150, 0.6)';
    ctx.beginPath();
    ctx.ellipse(900, 520, 200, 100, 0, 0, Math.PI * 2);
    ctx.fill();

    // 大暗斑边缘（稍亮的描边）
    ctx.strokeStyle = 'rgba(50, 100, 200, 0.4)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(900, 520, 200, 100, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 3. 淡色云层
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 100 + 50;
        const alpha = Math.random() * 0.25 + 0.08;
        const cloudGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        cloudGradient.addColorStop(0, `rgba(150, 200, 255, ${alpha})`);
        cloudGradient.addColorStop(1, 'rgba(150, 200, 255, 0)');
        ctx.fillStyle = cloudGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 4. 白色风暴云（明亮的白色斑点，优化：35个）
    for (let i = 0; i < 35; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 80 + 40;
        const ry = Math.random() * 50 + 25;
        const alpha = Math.random() * 0.4 + 0.2;
        ctx.fillStyle = `rgba(200, 230, 255, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 5. 暗色小风暴（优化：25个）
    for (let i = 0; i < 25; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 60 + 30;
        const ry = Math.random() * 40 + 20;
        const alpha = Math.random() * 0.3 + 0.1;
        ctx.fillStyle = `rgba(40, 80, 180, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 6. 极地区域（稍暗）
    // 北极
    const np = ctx.createRadialGradient(1024, 60, 0, 1024, 60, 280);
    np.addColorStop(0, 'rgba(30, 60, 150, 0.3)');
    np.addColorStop(1, 'rgba(30, 60, 150, 0)');
    ctx.fillStyle = np;
    ctx.beginPath();
    ctx.ellipse(1024, 60, 380, 140, 0, 0, Math.PI * 2);
    ctx.fill();

    // 南极
    const sp = ctx.createRadialGradient(1024, 964, 0, 1024, 964, 280);
    sp.addColorStop(0, 'rgba(30, 60, 150, 0.3)');
    sp.addColorStop(1, 'rgba(30, 60, 150, 0)');
    ctx.fillStyle = sp;
    ctx.beginPath();
    ctx.ellipse(1024, 964, 380, 140, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}

/**
 * 海王星大气层纹理（极淡蓝色光晕）
 */
export function createNeptuneAtmosphereTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(256, 128, 0, 256, 128, 256);
    gradient.addColorStop(0, 'rgba(80, 150, 255, 0.15)');
    gradient.addColorStop(0.8, 'rgba(80, 150, 255, 0.08)');
    gradient.addColorStop(1, 'rgba(80, 150, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}
