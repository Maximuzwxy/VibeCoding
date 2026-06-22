/**
 * 地球纹理生成
 * 海洋蓝色底色 + 亚欧/北美/南美/非洲/大洋洲大陆 + 沙漠 + 山脉 + 冰盖
 * 额外导出云层纹理（半透明白色斑块）
 */

import * as THREE from 'three';

export function createEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 海洋基础（深蓝）
    ctx.fillStyle = '#1a4d7c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ========== 大陆板块 ==========
    ctx.fillStyle = '#2d5a1e';

    // 亚欧大陆
    ctx.beginPath();
    ctx.ellipse(1150, 280, 280, 90, 0, 0, Math.PI * 2);
    ctx.fill();

    // 日本
    ctx.beginPath();
    ctx.ellipse(1520, 290, 15, 40, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 台湾
    ctx.beginPath();
    ctx.ellipse(1480, 340, 12, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 印尼
    ctx.beginPath();
    ctx.ellipse(1450, 480, 100, 25, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // 大洋洲
    ctx.beginPath();
    ctx.ellipse(1580, 620, 100, 70, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 北美洲
    ctx.beginPath();
    ctx.ellipse(380, 260, 130, 90, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 南美洲
    ctx.beginPath();
    ctx.ellipse(560, 560, 70, 120, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 非洲
    ctx.beginPath();
    ctx.ellipse(1020, 480, 90, 110, 0, 0, Math.PI * 2);
    ctx.fill();

    // ========== 冰盖 ==========
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(1024, 40, 280, 35, 0, 0, Math.PI * 2);   // 北极
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1024, 980, 380, 40, 0, 0, Math.PI * 2);  // 南极
    ctx.fill();

    // ========== 地形细节 ==========
    // 沙漠
    ctx.fillStyle = '#c4a35a';
    ctx.beginPath();
    ctx.ellipse(1050, 420, 80, 40, 0, 0, Math.PI * 2);  // 撒哈拉
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1200, 320, 60, 35, 0, 0, Math.PI * 2);  // 中亚
    ctx.fill();

    // 山脉
    ctx.fillStyle = 'rgba(101, 67, 33, 0.6)';
    ctx.beginPath();
    ctx.ellipse(1280, 340, 50, 15, 0, 0, Math.PI * 2);  // 喜马拉雅
    ctx.fill();

    // 随机绿色斑点
    ctx.fillStyle = 'rgba(45, 90, 30, 0.4)';
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 25 + 8, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}

/**
 * 云层纹理（白色半透明，覆盖在地球表面之上）
 * 云层作为 earth mesh 的子对象，跟随自转
 */
export function createEarthCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 40 + 20;
        const alpha = Math.random() * 0.4 + 0.1;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}
