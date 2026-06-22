/**
 * 土星纹理生成
 * 淡黄米色底色 + 30条大气带 + 淡色云层 + 暗色/白色风暴斑 + 极地区域
 */

import * as THREE from 'three';

export function createSaturnTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 淡黄米色底色
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f0e6d0');
    gradient.addColorStop(0.2, '#e6d8b8');
    gradient.addColorStop(0.4, '#d4c8a8');
    gradient.addColorStop(0.5, '#ead6b8');
    gradient.addColorStop(0.6, '#d4c8a8');
    gradient.addColorStop(0.8, '#e6d8b8');
    gradient.addColorStop(1, '#f0e6d0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 大气带（横向条纹）
    for (let i = 0; i < 30; i++) {
        const y = (canvas.height / 30) * i;
        const height = Math.random() * 40 + 20;
        const alpha = Math.random() * 0.25 + 0.1;
        const bandColor = Math.random() > 0.5
            ? `rgba(220, 200, 160, ${alpha})`
            : `rgba(180, 160, 120, ${alpha})`;
        ctx.fillStyle = bandColor;
        ctx.fillRect(0, y, canvas.width, height);
    }

    // 2. 淡色云层
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 100 + 50;
        const alpha = Math.random() * 0.2 + 0.08;
        const cg = ctx.createRadialGradient(x, y, 0, x, y, radius);
        cg.addColorStop(0, `rgba(240, 230, 200, ${alpha})`);
        cg.addColorStop(1, 'rgba(240, 230, 200, 0)');
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. 暗色风暴
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillStyle = `rgba(140, 120, 90, ${Math.random() * 0.25 + 0.1})`;
        ctx.beginPath();
        ctx.ellipse(x, y, Math.random() * 70 + 35, Math.random() * 45 + 22, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 4. 白色风暴
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillStyle = `rgba(250, 245, 230, ${Math.random() * 0.3 + 0.15})`;
        ctx.beginPath();
        ctx.ellipse(x, y, Math.random() * 60 + 30, Math.random() * 40 + 20, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 5. 北极
    const npg = ctx.createRadialGradient(1024, 60, 0, 1024, 60, 300);
    npg.addColorStop(0, 'rgba(180, 160, 130, 0.3)');
    npg.addColorStop(1, 'rgba(180, 160, 130, 0)');
    ctx.fillStyle = npg;
    ctx.beginPath();
    ctx.ellipse(1024, 60, 400, 150, 0, 0, Math.PI * 2);
    ctx.fill();

    // 6. 南极
    const spg = ctx.createRadialGradient(1024, 964, 0, 1024, 964, 300);
    spg.addColorStop(0, 'rgba(180, 160, 130, 0.3)');
    spg.addColorStop(1, 'rgba(180, 160, 130, 0)');
    ctx.fillStyle = spg;
    ctx.beginPath();
    ctx.ellipse(1024, 964, 400, 150, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}

/**
 * 创建土星粒子环（7 层环带 + 卡西尼缝 + 恩克缝）
 * 返回 THREE.Points 对象，需添加到 centerGroup
 */
export function createSaturnRing() {
    const ringBands = [
        { inner: 3.1, outer: 3.6, density: 0.5, color: new THREE.Color(0xc8beb0), name: 'C环' },
        { inner: 3.6, outer: 4.5, density: 1.2, color: new THREE.Color(0xdcd2be), name: 'B环' },
        { inner: 4.5, outer: 4.7, density: 0.1, color: new THREE.Color(0x908070), name: '卡西尼缝' },
        { inner: 4.7, outer: 5.4, density: 0.9, color: new THREE.Color(0xd8d0b8), name: 'A环' },
        { inner: 5.4, outer: 5.5, density: 0.15, color: new THREE.Color(0x807060), name: '恩克缝' },
        { inner: 5.5, outer: 5.7, density: 0.5, color: new THREE.Color(0xc8c0a8), name: 'A外缘' },
        { inner: 5.7, outer: 5.85, density: 0.3, color: new THREE.Color(0xb0a890), name: 'F环' }
    ];

    let totalWeight = 0;
    ringBands.forEach(band => { totalWeight += (band.outer - band.inner) * band.density; });

    const totalParticles = 5000;
    const positions = [];
    const colors = [];

    ringBands.forEach(band => {
        const bandWeight = (band.outer - band.inner) * band.density;
        const bandParticles = Math.floor(totalParticles * (bandWeight / totalWeight));
        for (let i = 0; i < bandParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = band.inner + Math.random() * (band.outer - band.inner);
            positions.push(Math.cos(angle) * radius, (Math.random() - 0.5) * 0.03, Math.sin(angle) * radius);
            const brightness = 0.7 + Math.random() * 0.4;
            colors.push(band.color.r * brightness, band.color.g * brightness, band.color.b * brightness);
        }
    });

    const ringGeo = new THREE.BufferGeometry();
    ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    ringGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const ringMat = new THREE.PointsMaterial({
        size: 0.07,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });

    return new THREE.Points(ringGeo, ringMat);
}
