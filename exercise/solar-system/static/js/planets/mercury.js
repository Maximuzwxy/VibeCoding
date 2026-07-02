// 水星 3D 场景模块

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let mercury;
let animationFrameId = null;

// 清除当前场景
function clearCurrentScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;
    container.innerHTML = '';
}

// 初始化水星场景
export function initMercuryScene() {
    clearMercuryScene();
    clearCurrentScene();

    const container = document.getElementById('scene-container');
    if (!container) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 15;

    // 灯光
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    createStarfield();
    createMercury();

    animate();
}

// 创建星空背景
function createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsVertices = [];

    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 400;
        const y = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));

    // 创建圆形纹理
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 32, 32);
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);

    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.3,
        sizeAttenuation: true,
        map: texture,
        transparent: true,
        alphaTest: 0.5
    });

    scene.add(new THREE.Points(starsGeometry, starsMaterial));
}

// 创建水星
function createMercury() {
    const geometry = new THREE.SphereGeometry(0.6, 64, 64);

    // 创建水星纹理
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 水星基础颜色（灰色）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#9a9a9a');
    gradient.addColorStop(0.5, '#b5b5b5');
    gradient.addColorStop(1, '#9a9a9a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ========== 地表特征 ==========

    // 1. 卡洛里盆地（Caloris Basin）- 最大撞击坑
    ctx.fillStyle = '#8a8a8a';
    ctx.beginPath();
    ctx.arc(1024, 520, 150, 0, Math.PI * 2);
    ctx.fill();

    // 卡洛里盆地边缘（环形山）
    ctx.strokeStyle = '#7a7a7a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(1024, 520, 150, 0, Math.PI * 2);
    ctx.stroke();

    // 卡洛里盆地内部同心环
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(1024, 520, 100, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(1024, 520, 50, 0, Math.PI * 2);
    ctx.stroke();

    // 2. 其他撞击坑（随机分布）
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 30 + 5;
        const alpha = Math.random() * 0.3 + 0.1;

        // 撞击坑主体
        ctx.fillStyle = `rgba(120, 120, 120, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 撞击坑边缘
        ctx.strokeStyle = `rgba(100, 100, 100, ${alpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // 有些撞击坑有中心峰
        if (Math.random() > 0.7 && radius > 15) {
            ctx.fillStyle = `rgba(140, 140, 140, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 3. 辐射纹（某些撞击坑的辐射状条纹）
    for (let i = 0; i < 15; i++) {
        const cx = Math.random() * canvas.width;
        const cy = Math.random() * canvas.height;
        const numRays = Math.floor(Math.random() * 8) + 6;
        const rayLength = Math.random() * 80 + 40;

        ctx.strokeStyle = 'rgba(180, 180, 180, 0.3)';
        ctx.lineWidth = 1;

        for (let j = 0; j < numRays; j++) {
            const angle = (j / numRays) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(
                cx + Math.cos(angle) * rayLength,
                cy + Math.sin(angle) * rayLength
            );
            ctx.stroke();
        }
    }

    // 4. 暗色区域（月海类似的平原）
    ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 100 + 50;
        const ry = Math.random() * 80 + 40;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const material = new THREE.MeshPhongMaterial({
        map: texture,
        bumpScale: 0.05,
        specular: new THREE.Color(0x333333),
        shininess: 5
    });

    mercury = new THREE.Mesh(geometry, material);
    
    // 水星轴倾角很小（约 0.034 度），几乎垂直
    mercury.rotation.z = 0.034 * Math.PI / 180;
    // 初始旋转角度
    mercury.rotation.y = 0;
    
    scene.add(mercury);
}

// 窗口大小调整
function onWindowResize() {
    if (!camera || !renderer) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 动画循环
function animate() {
    animationFrameId = requestAnimationFrame(animate);

    if (!mercury || !scene || !camera || !renderer) return;

    // 水星自转（很慢，58.6 天一圈）
    mercury.rotation.y += 0.001;

    controls.update();
    renderer.render(scene, camera);
}

// 清除水星场景
export function clearMercuryScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // 清理事件监听
    window.removeEventListener('resize', onWindowResize);

    // 释放纹理资源
    if (mercury && mercury.material) {
        if (mercury.material.map) {
            mercury.material.map.dispose();
        }
        mercury.material.dispose();
    }

    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
    }
    if (scene) {
        scene.clear();
    }

    scene = null;
    camera = null;
    renderer = null;
    controls = null;
    mercury = null;
    animationFrameId = null;
}
