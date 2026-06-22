// 金星 3D 场景模块

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let venus, clouds;
let animationFrameId = null;

// 清除当前场景
function clearCurrentScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;
    container.innerHTML = '';
}

// 初始化金星场景
export function initVenusScene() {
    clearVenusScene();
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
    createVenus();

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

// 创建金星
function createVenus() {
    const geometry = new THREE.SphereGeometry(0.95, 64, 64);

    // 创建金星纹理
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 金星基础颜色（橙黄色云层）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#e6c87a');
    gradient.addColorStop(0.3, '#d4a95a');
    gradient.addColorStop(0.5, '#c49a4a');
    gradient.addColorStop(0.7, '#d4a95a');
    gradient.addColorStop(1, '#e6c87a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ========== 云层特征 ==========

    // 1. 浓厚云层（带状云纹）
    for (let i = 0; i < 30; i++) {
        const y = Math.random() * canvas.height;
        const height = Math.random() * 40 + 20;
        const alpha = Math.random() * 0.3 + 0.1;
        
        ctx.fillStyle = `rgba(255, 230, 180, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(
            Math.random() * canvas.width,
            y,
            Math.random() * 200 + 100,
            height,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    // 2. 云层漩涡（类似金星极地的漩涡结构）
    // 北半球漩涡
    const vortex1X = 1024;
    const vortex1Y = 150;
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(255, 240, 200, ${0.3 - i * 0.05})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(vortex1X, vortex1Y, 30 + i * 20, 0.2, Math.PI * 1.8);
        ctx.stroke();
    }

    // 南半球漩涡
    const vortex2X = 1024;
    const vortex2Y = 874;
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(255, 240, 200, ${0.3 - i * 0.05})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(vortex2X, vortex2Y, 30 + i * 20, 0.2, Math.PI * 1.8);
        ctx.stroke();
    }

    // 3. 云带（横向条纹）
    for (let i = 0; i < 15; i++) {
        const y = (canvas.height / 15) * i;
        const height = Math.random() * 20 + 10;
        const alpha = Math.random() * 0.2 + 0.05;
        
        ctx.fillStyle = `rgba(220, 180, 120, ${alpha})`;
        ctx.fillRect(0, y, canvas.width, height);
    }

    // 4. 随机云团
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 50 + 20;
        const alpha = Math.random() * 0.25 + 0.05;
        
        const cloudGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        cloudGradient.addColorStop(0, `rgba(255, 240, 200, ${alpha})`);
        cloudGradient.addColorStop(1, 'rgba(255, 240, 200, 0)');
        
        ctx.fillStyle = cloudGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 5. 暗色区域（云层中的暗带）
    ctx.fillStyle = 'rgba(180, 140, 80, 0.15)';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 150 + 50;
        const ry = Math.random() * 30 + 15;
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
        shininess: 20
    });

    venus = new THREE.Mesh(geometry, material);
    
    // 金星轴倾角 177.4°（逆向自转，几乎倒立）
    venus.rotation.z = 177.4 * Math.PI / 180;
    // 初始旋转角度
    venus.rotation.y = 0;
    
    scene.add(venus);

    // 外层云（半透明）
    const cloudGeometry = new THREE.SphereGeometry(0.98, 64, 64);
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 1024;
    cloudCanvas.height = 512;
    const cloudCtx = cloudCanvas.getContext('2d');
    cloudCtx.fillStyle = 'rgba(0, 0, 0, 0)';
    cloudCtx.fillRect(0, 0, cloudCanvas.width, cloudCanvas.height);

    // 绘制外层云
    for (let i = 0; i < 150; i++) {
        const x = Math.random() * cloudCanvas.width;
        const y = Math.random() * cloudCanvas.height;
        const radius = Math.random() * 60 + 30;
        const alpha = Math.random() * 0.3 + 0.1;
        const gradient = cloudCtx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(255, 245, 220, ${alpha})`);
        gradient.addColorStop(1, 'rgba(255, 245, 220, 0)');
        cloudCtx.beginPath();
        cloudCtx.arc(x, y, radius, 0, Math.PI * 2);
        cloudCtx.fillStyle = gradient;
        cloudCtx.fill();
    }

    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    const cloudMaterial = new THREE.MeshPhongMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });

    clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(clouds);
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

    if (!venus || !scene || !camera || !renderer) return;

    // 金星自转（逆向，跟火星速度一样）
    venus.rotation.y -= 0.003;  // 负号表示逆向自转（自东向西）

    // 云层旋转（比金星表面稍快）
    if (clouds) {
        clouds.rotation.y -= 0.004;
    }

    controls.update();
    renderer.render(scene, camera);
}

// 清除金星场景
export function clearVenusScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // 清理事件监听
    window.removeEventListener('resize', onWindowResize);

    // 释放纹理资源
    if (venus && venus.material) {
        if (venus.material.map) {
            venus.material.map.dispose();
        }
        venus.material.dispose();
    }
    if (clouds && clouds.material) {
        if (clouds.material.map) {
            clouds.material.map.dispose();
        }
        clouds.material.dispose();
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
    venus = null;
    clouds = null;
    animationFrameId = null;
}
