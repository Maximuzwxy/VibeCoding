/**
 * 月球纹理生成（地球唯一卫星）
 * 灰色底色 + 月海暗区 + 大型撞击坑 + 第谷辐射纹 + 300小陨石坑 + 高地亮区
 * 参照 solar-system 项目优化：增强月海层次 + 增加高地斑块
 */

import * as THREE from 'three';

export function createMoonTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 灰色底色（优化：7段渐变比参照的3段更丰富）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#a8a8a8');
    gradient.addColorStop(0.16, '#b0b0b0');
    gradient.addColorStop(0.33, '#b8b8b8');
    gradient.addColorStop(0.5, '#c0c0c0');
    gradient.addColorStop(0.66, '#b8b8b8');
    gradient.addColorStop(0.83, '#b0b0b0');
    gradient.addColorStop(1, '#a8a8a8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ========== 月海（暗色玄武岩平原）==========
    ctx.fillStyle = '#606060';

    // 风暴洋（最大月海）
    ctx.beginPath();
    ctx.ellipse(600, 520, 350, 200, 0, 0, Math.PI * 2);
    ctx.fill();

    // 雨海
    ctx.beginPath();
    ctx.ellipse(900, 450, 150, 100, 0, 0, Math.PI * 2);
    ctx.fill();

    // 静海
    ctx.beginPath();
    ctx.ellipse(1100, 500, 120, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    // 澄海
    ctx.beginPath();
    ctx.ellipse(1050, 400, 100, 70, 0, 0, Math.PI * 2);
    ctx.fill();

    // 危海
    ctx.beginPath();
    ctx.ellipse(1300, 420, 100, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    // 丰富海
    ctx.beginPath();
    ctx.ellipse(1350, 550, 90, 70, 0, 0, Math.PI * 2);
    ctx.fill();

    // 优化：月海边缘渐变（更自然过渡）
    ctx.fillStyle = '#707070';
    ctx.beginPath();
    ctx.ellipse(700, 510, 280, 180, 0, 0, Math.PI * 2);
    ctx.fill();

    // ========== 大型撞击坑 ==========
    ctx.fillStyle = '#909090';

    // 第谷坑（有明显辐射纹）
    ctx.beginPath();
    ctx.arc(1000, 700, 40, 0, Math.PI * 2);
    ctx.fill();

    // 哥白尼坑
    ctx.beginPath();
    ctx.arc(800, 480, 35, 0, Math.PI * 2);
    ctx.fill();

    // 开普勒坑
    ctx.beginPath();
    ctx.arc(700, 490, 25, 0, Math.PI * 2);
    ctx.fill();

    // ========== 第谷辐射纹 ==========
    ctx.strokeStyle = 'rgba(190, 190, 190, 0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const length = Math.random() * 200 + 100;
        ctx.beginPath();
        ctx.moveTo(1000, 700);
        ctx.lineTo(
            1000 + Math.cos(angle) * length,
            700 + Math.sin(angle) * length
        );
        ctx.stroke();
    }

    // ========== 小型撞击坑（300个，随机分布）==========
    for (let i = 0; i < 300; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 20 + 3;
        const alpha = Math.random() * 0.3 + 0.1;
        const shade = 120 + Math.random() * 40;
        ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // ========== 高地亮区（优化：60个，比参照多10个）==========
    ctx.fillStyle = 'rgba(210, 210, 210, 0.2)';
    for (let i = 0; i < 60; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 80 + 40;
        const ry = Math.random() * 60 + 30;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}
