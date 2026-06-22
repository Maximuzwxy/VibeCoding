// 火星 3D 场景模块

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let mars, atmosphere;
let phobos, deimos;  // 火卫一、火卫二
let phobosOrbit, deimosOrbit;
let animationFrameId = null;

// 清除当前场景
function clearCurrentScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;
    container.innerHTML = '';
}

// 初始化火星场景
export function initMarsScene() {
    clearMarsScene();
    clearCurrentScene();

    const container = document.getElementById('scene-container');
    if (!container) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 7);
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
    createMars();
    createMoons();

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

// 创建火星
function createMars() {
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    // 创建火星纹理
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 火星基础颜色（红褐色）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#c15a3a');
    gradient.addColorStop(0.5, '#b7410e');
    gradient.addColorStop(1, '#c15a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ========== 地表特征 ==========

    // 1. 北极冰盖（白色，椭圆形）
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.ellipse(1024, 60, 300, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // 冰盖边缘的淡出效果
    const iceCapGradient = ctx.createRadialGradient(1024, 60, 0, 1024, 60, 350);
    iceCapGradient.addColorStop(0, 'rgba(240, 240, 240, 0.9)');
    iceCapGradient.addColorStop(0.7, 'rgba(240, 240, 240, 0.5)');
    iceCapGradient.addColorStop(1, 'rgba(240, 240, 240, 0)');
    ctx.fillStyle = iceCapGradient;
    ctx.beginPath();
    ctx.ellipse(1024, 60, 350, 70, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. 南极冰盖（白色，椭圆形，较小）
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.ellipse(1024, 970, 250, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. 水手峡谷（Valles Marineris）- 长椭圆形峡谷
    // 实际长度约 4000km，占火星周长约 18.7%，宽度约 200km
    // 2048 × 18.7% ≈ 383 像素（全长），半长轴 ≈ 190
    // 宽度比例：200/4000 = 5%，383 × 5% ≈ 19
    ctx.fillStyle = '#8b3a1e';
    ctx.beginPath();
    ctx.ellipse(1150, 520, 220, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. 奥林匹斯山（Olympus Mons）- 太阳系最高峰
    // 用圆形区域表示火山区域
    // 位置：西经 133°，北纬 18.6°（在纹理左侧）
    const olympusX = 550;
    const olympusY = 320;
    
    // 火山基底（深色环形）
    ctx.fillStyle = '#8b3a1e';
    ctx.beginPath();
    ctx.arc(olympusX, olympusY, 80, 0, Math.PI * 2);
    ctx.fill();

    // 火山口（中心凹陷）
    ctx.fillStyle = '#6b2a0e';
    ctx.beginPath();
    ctx.arc(olympusX, olympusY, 35, 0, Math.PI * 2);
    ctx.fill();

    // 火山口边缘（亮色环）
    ctx.strokeStyle = '#d46a4a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(olympusX, olympusY, 35, 0, Math.PI * 2);
    ctx.stroke();

    // 5. 其他火山区域（塔尔西斯高原）
    // ctx.fillStyle = '#a94a2a';
    // ctx.beginPath();
    // ctx.ellipse(850, 400, 150, 120, 0, 0, Math.PI * 2);
    // ctx.fill();

    // 6. 随机地表纹理（陨石坑和地形变化）
    for (let i = 0; i < 150; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 20 + 3;
        const alpha = Math.random() * 0.3 + 0.1;
        
        // 陨石坑
        ctx.fillStyle = `rgba(139, 58, 30, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 陨石坑边缘
        ctx.strokeStyle = `rgba(180, 80, 50, ${alpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // 7. 暗色区域（火星上的暗斑）
    ctx.fillStyle = 'rgba(101, 47, 23, 0.4)';
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 60 + 20;
        const ry = Math.random() * 40 + 15;
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
        shininess: 10
    });

    mars = new THREE.Mesh(geometry, material);

    // 设置火星轴倾角（25.2 度）和初始旋转
    mars.rotation.z = 25.2 * Math.PI / 180;
    mars.rotation.y = 0;  // 0 度时，纹理中心正对相机

    scene.add(mars);

    // 稀薄的大气层（非常淡的橙色光晕）
    const atmosphereGeometry = new THREE.SphereGeometry(1.03, 64, 64);
    const atmosphereCanvas = document.createElement('canvas');
    atmosphereCanvas.width = 512;
    atmosphereCanvas.height = 256;
    const atmosphereCtx = atmosphereCanvas.getContext('2d');
    
    const atmoGradient = atmosphereCtx.createRadialGradient(256, 128, 0, 256, 128, 256);
    atmoGradient.addColorStop(0, 'rgba(193, 90, 58, 0.05)');
    atmoGradient.addColorStop(0.8, 'rgba(193, 90, 58, 0.02)');
    atmoGradient.addColorStop(1, 'rgba(193, 90, 58, 0)');
    
    atmosphereCtx.fillStyle = atmoGradient;
    atmosphereCtx.fillRect(0, 0, atmosphereCanvas.width, atmosphereCanvas.height);

    const atmosphereTexture = new THREE.CanvasTexture(atmosphereCanvas);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
        map: atmosphereTexture,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    mars.add(atmosphere);  // 大气层作为火星的子对象，跟随火星倾角
}

// 创建火卫一和火卫二
function createMoons() {
    // 火卫一（Phobos）- 较近，较大
    const phobosDistance = 2.2;
    const phobosGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const phobosMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b7355,
        roughness: 0.9,
        metalness: 0.1
    });

    phobos = new THREE.Mesh(phobosGeometry, phobosMaterial);
    phobos.userData = {
        distance: phobosDistance,
        speed: -0.008,  // 负数表示逆时针公转
        angle: Math.random() * Math.PI * 2
    };

    scene.add(phobos);

    // 火卫一轨道
    phobosOrbit = createMoonOrbit(phobosDistance);
    scene.add(phobosOrbit);

    // 火卫二（Deimos）- 较远，较小
    const deimosDistance = 3.0;
    const deimosGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const deimosMaterial = new THREE.MeshStandardMaterial({
        color: 0xa0826d,
        roughness: 0.9,
        metalness: 0.1
    });

    deimos = new THREE.Mesh(deimosGeometry, deimosMaterial);
    deimos.userData = {
        distance: deimosDistance,
        speed: -0.004,  // 负数表示逆时针公转，比火卫一慢
        angle: Math.random() * Math.PI * 2
    };

    scene.add(deimos);

    // 火卫二轨道
    deimosOrbit = createMoonOrbit(deimosDistance);
    scene.add(deimosOrbit);
}

// 创建卫星轨道
function createMoonOrbit(distance) {
    const points = [];
    for (let i = 0; i <= 128; i++) {
        const angle = (i / 128) * Math.PI * 2;
        points.push(new THREE.Vector3(
            Math.cos(angle) * distance,
            0,
            Math.sin(angle) * distance
        ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: 0x666666,
        transparent: true,
        opacity: 0.5
    });

    return new THREE.Line(geometry, material);
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

    if (!mars || !scene || !camera || !renderer) return;

    // 火星自转
    mars.rotation.y += 0.003;

    // 火卫一公转（沿轨道，逆时针）
    if (phobos) {
        phobos.userData.angle += phobos.userData.speed;
        const angle = phobos.userData.angle;
        const distance = phobos.userData.distance;
        // 在火星组坐标系中运行（XZ 平面）
        phobos.position.x = Math.cos(angle) * distance;
        phobos.position.z = Math.sin(angle) * distance;
        phobos.position.y = 0;  // 在轨道平面上
        phobos.rotation.y += 0.005;
    }

    // 火卫二公转（沿轨道，逆时针，较慢）
    if (deimos) {
        deimos.userData.angle += deimos.userData.speed;
        const angle = deimos.userData.angle;
        const distance = deimos.userData.distance;
        deimos.position.x = Math.cos(angle) * distance;
        deimos.position.z = Math.sin(angle) * distance;
        deimos.position.y = 0;  // 在轨道平面上
        deimos.rotation.y += 0.003;
    }

    controls.update();
    renderer.render(scene, camera);
}

// 清除火星场景
export function clearMarsScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // 清理事件监听
    window.removeEventListener('resize', onWindowResize);

    // 释放纹理资源
    if (mars && mars.material) {
        if (mars.material.map) {
            mars.material.map.dispose();
        }
        mars.material.dispose();
    }
    if (atmosphere && atmosphere.material) {
        if (atmosphere.material.map) {
            atmosphere.material.map.dispose();
        }
        atmosphere.material.dispose();
    }
    if (phobos && phobos.material) {
        phobos.material.dispose();
    }
    if (deimos && deimos.material) {
        deimos.material.dispose();
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
    mars = null;
    phobos = null;
    deimos = null;
    phobosOrbit = null;
    deimosOrbit = null;
    animationFrameId = null;
}
