// 月球 3D 场景模块

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let moon;
let animationFrameId = null;

// 清除当前场景
function clearCurrentScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;
    container.innerHTML = '';
}

// 初始化月球场景
export function initMoonScene() {
    clearMoonScene();
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
    createMoon();

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

// 创建月球
function createMoon() {
    const geometry = new THREE.SphereGeometry(0.8, 64, 64);

    // 创建月球纹理
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 月球基础颜色（灰色）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#b0b0b0');
    gradient.addColorStop(0.5, '#c0c0c0');
    gradient.addColorStop(1, '#b0b0b0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ========== 地表特征 ==========

    // 1. 月海（暗色区域）
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

    // 2. 大型撞击坑
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

    // 3. 辐射纹（从第谷坑发出）
    ctx.strokeStyle = 'rgba(180, 180, 180, 0.3)';
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

    // 4. 小型撞击坑（随机分布）
    for (let i = 0; i < 300; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 20 + 3;
        const alpha = Math.random() * 0.3 + 0.1;
        
        ctx.fillStyle = `rgba(${120 + Math.random() * 40}, ${120 + Math.random() * 40}, ${120 + Math.random() * 40}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 5. 高地（亮色区域）
    ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
    for (let i = 0; i < 50; i++) {
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

    const material = new THREE.MeshPhongMaterial({
        map: texture,
        bumpScale: 0.05,
        specular: new THREE.Color(0x222222),
        shininess: 5
    });

    moon = new THREE.Mesh(geometry, material);
    
    // 月球轴倾角很小（约 1.5 度）
    moon.rotation.z = 1.5 * Math.PI / 180;
    // 初始旋转角度
    moon.rotation.y = 0;
    
    scene.add(moon);
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

    if (!moon || !scene || !camera || !renderer) return;

    // 月球自转（逆时针，参考金星速度）
    moon.rotation.y += 0.003;

    controls.update();
    renderer.render(scene, camera);
}

// 清除月球场景
export function clearMoonScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // 清理事件监听
    window.removeEventListener('resize', onWindowResize);

    // 释放纹理资源
    if (moon && moon.material) {
        if (moon.material.map) {
            moon.material.map.dispose();
        }
        moon.material.dispose();
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
    moon = null;
    animationFrameId = null;
}
