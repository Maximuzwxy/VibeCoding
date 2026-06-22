// 海王星 3D 场景模块

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let neptune, clouds, atmosphere;
let triton;  // 海卫一
let tritonOrbit;  // 海卫一轨道
let animationFrameId = null;

// 清除当前场景
function clearCurrentScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;
    container.innerHTML = '';
}

// 初始化海王星场景
export function initNeptuneScene() {
    clearNeptuneScene();
    clearCurrentScene();

    const container = document.getElementById('scene-container');
    if (!container) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 6, 14);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 4;
    controls.maxDistance = 40;

    // 灯光
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    createStarfield();
    createNeptune();
    createTriton();

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

// 创建海王星
function createNeptune() {
    const geometry = new THREE.SphereGeometry(1.7, 64, 64);

    // 创建海王星纹理
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 海王星基础颜色（深蓝色）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#3366ff');
    gradient.addColorStop(0.3, '#2244ff');
    gradient.addColorStop(0.5, '#1a33cc');
    gradient.addColorStop(0.7, '#2244ff');
    gradient.addColorStop(1, '#3366ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ========== 大气特征 ==========

    // 1. 大气带（横向条纹，淡蓝色）
    for (let i = 0; i < 25; i++) {
        const y = (canvas.height / 25) * i;
        const height = Math.random() * 35 + 20;
        const alpha = Math.random() * 0.2 + 0.08;
        
        ctx.fillStyle = `rgba(100, 160, 255, ${alpha})`;
        ctx.fillRect(0, y, canvas.width, height);
    }

    // 2. 大暗斑（Great Dark Spot）- 椭圆形暗区
    ctx.fillStyle = 'rgba(30, 60, 150, 0.6)';
    ctx.beginPath();
    ctx.ellipse(900, 520, 200, 100, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 大暗斑边缘（稍亮）
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

    // 4. 白色风暴云（明亮的白色斑点）
    for (let i = 0; i < 30; i++) {
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

    // 5. 暗色风暴（小暗斑）
    for (let i = 0; i < 20; i++) {
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
    const northPoleGradient = ctx.createRadialGradient(1024, 60, 0, 1024, 60, 280);
    northPoleGradient.addColorStop(0, 'rgba(30, 60, 150, 0.3)');
    northPoleGradient.addColorStop(1, 'rgba(30, 60, 150, 0)');
    ctx.fillStyle = northPoleGradient;
    ctx.beginPath();
    ctx.ellipse(1024, 60, 380, 140, 0, 0, Math.PI * 2);
    ctx.fill();

    // 南极
    const southPoleGradient = ctx.createRadialGradient(1024, 964, 0, 1024, 964, 280);
    southPoleGradient.addColorStop(0, 'rgba(30, 60, 150, 0.3)');
    southPoleGradient.addColorStop(1, 'rgba(30, 60, 150, 0)');
    ctx.fillStyle = southPoleGradient;
    ctx.beginPath();
    ctx.ellipse(1024, 964, 380, 140, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const material = new THREE.MeshPhongMaterial({
        map: texture,
        bumpScale: 0.05,
        specular: new THREE.Color(0x222222),
        shininess: 30
    });

    neptune = new THREE.Mesh(geometry, material);
    
    // 海王星轴倾角 28.3°
    neptune.rotation.z = 28.3 * Math.PI / 180;
    // 初始旋转角度
    neptune.rotation.y = 0;
    
    scene.add(neptune);

    // 外层大气（半透明淡蓝色）
    const atmosphereGeometry = new THREE.SphereGeometry(1.75, 64, 64);
    const atmosphereCanvas = document.createElement('canvas');
    atmosphereCanvas.width = 512;
    atmosphereCanvas.height = 256;
    const atmosphereCtx = atmosphereCanvas.getContext('2d');
    atmosphereCtx.fillStyle = 'rgba(0, 0, 0, 0)';
    atmosphereCtx.fillRect(0, 0, atmosphereCanvas.width, atmosphereCanvas.height);

    // 绘制淡蓝色大气
    const atmoGradient = atmosphereCtx.createRadialGradient(256, 128, 0, 256, 128, 256);
    atmoGradient.addColorStop(0, 'rgba(80, 150, 255, 0.15)');
    atmoGradient.addColorStop(0.8, 'rgba(80, 150, 255, 0.08)');
    atmoGradient.addColorStop(1, 'rgba(80, 150, 255, 0)');
    
    atmosphereCtx.fillStyle = atmoGradient;
    atmosphereCtx.fillRect(0, 0, atmosphereCanvas.width, atmosphereCanvas.height);

    const atmosphereTexture = new THREE.CanvasTexture(atmosphereCanvas);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
        map: atmosphereTexture,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);
}

// 创建海卫一（Triton）
function createTriton() {
    // 海卫一数据
    const tritonDistance = 5.5;
    const tritonSize = 0.22;  // 较大的卫星
    const tritonColor = 0xc8b8a8;  // 灰褐色
    const tritonSpeed = -0.006;  // 负数表示顺时针（逆行轨道）

    // 创建海卫一
    const tritonGeometry = new THREE.SphereGeometry(tritonSize, 24, 24);
    const tritonMaterial = new THREE.MeshStandardMaterial({
        color: tritonColor,
        roughness: 0.85,
        metalness: 0.15
    });

    triton = new THREE.Mesh(tritonGeometry, tritonMaterial);
    triton.userData = {
        distance: tritonDistance,
        speed: tritonSpeed,  // 逆行（顺时针）
        angle: Math.random() * Math.PI * 2
    };

    scene.add(triton);

    // 创建海卫一轨道
    tritonOrbit = createMoonOrbit(tritonDistance);
    scene.add(tritonOrbit);
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

    if (!neptune || !scene || !camera || !renderer) return;

    // 海王星自转（16 小时 6 分一圈）
    neptune.rotation.y += 0.003;

    // 海卫一公转（顺时针，逆行轨道）
    if (triton) {
        triton.userData.angle += triton.userData.speed;
        const angle = triton.userData.angle;
        const distance = triton.userData.distance;
        triton.position.x = Math.cos(angle) * distance;
        triton.position.z = Math.sin(angle) * distance;
        triton.position.y = 0;
        triton.rotation.y += 0.002;
    }

    controls.update();
    renderer.render(scene, camera);
}

// 清除海王星场景
export function clearNeptuneScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // 清理事件监听
    window.removeEventListener('resize', onWindowResize);

    // 释放纹理资源
    if (neptune && neptune.material) {
        if (neptune.material.map) {
            neptune.material.map.dispose();
        }
        neptune.material.dispose();
    }
    if (atmosphere && atmosphere.material) {
        if (atmosphere.material.map) {
            atmosphere.material.map.dispose();
        }
        atmosphere.material.dispose();
    }
    if (triton && triton.material) {
        triton.material.dispose();
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
    neptune = null;
    clouds = null;
    triton = null;
    tritonOrbit = null;
    animationFrameId = null;
}
