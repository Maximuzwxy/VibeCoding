/**
 * 土卫六 Titan 纹理生成（浓厚大气、甲烷湖泊）
 * 橙黄色底色 + 大气雾霾 + 碳氢化合物沙丘 + 冰质地表 + 甲烷湖泊 + 大气条纹 + 云层
 * 参照 solar-system 老代码
 */

import * as THREE from 'three';

export function createTitanTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 橙黄色浓厚大气底色
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#c4a87c');
    gradient.addColorStop(0.3, '#d4b88c');
    gradient.addColorStop(0.5, '#e0c89c');
    gradient.addColorStop(0.7, '#d4b88c');
    gradient.addColorStop(1, '#c4a87c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 大气雾霾层（半透明橙色）
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 150 + 80;
        const fog = ctx.createRadialGradient(x, y, 0, x, y, radius);
        fog.addColorStop(0, 'rgba(220, 190, 140, 0.3)');
        fog.addColorStop(1, 'rgba(220, 190, 140, 0)');
        ctx.fillStyle = fog;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. 碳氢化合物沙丘（赤道暗色区域）
    ctx.fillStyle = 'rgba(120, 100, 70, 0.4)';
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const y = 400 + Math.random() * 224;
        const rx = Math.random() * 150 + 80;
        const ry = Math.random() * 60 + 30;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. 亮色区域（冰质地表）
    ctx.fillStyle = 'rgba(230, 210, 180, 0.3)';
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 120 + 60;
        const ry = Math.random() * 80 + 40;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 4. 甲烷湖泊（北极暗色区域）
    ctx.fillStyle = 'rgba(60, 50, 40, 0.5)';
    // 克拉肯海（Kraken Mare，最大）
    ctx.beginPath();
    ctx.ellipse(1024, 150, 250, 120, 0, 0, Math.PI * 2);
    ctx.fill();
    // 丽姬亚海（Ligeia Mare）
    ctx.beginPath();
    ctx.ellipse(900, 180, 120, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    // 蓬加海（Punga Mare）
    ctx.beginPath();
    ctx.ellipse(1150, 170, 100, 70, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5. 大气条纹（橙色带状）
    ctx.fillStyle = 'rgba(210, 180, 130, 0.25)';
    for (let i = 0; i < 20; i++) {
        const y = (canvas.height / 20) * i;
        const height = Math.random() * 40 + 20;
        ctx.fillRect(0, y, canvas.width, height);
    }

    // 6. 云层（淡橙色亮斑）
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 80 + 40;
        const cloud = ctx.createRadialGradient(x, y, 0, x, y, radius);
        cloud.addColorStop(0, 'rgba(240, 210, 160, 0.3)');
        cloud.addColorStop(1, 'rgba(240, 210, 160, 0)');
        ctx.fillStyle = cloud;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}
