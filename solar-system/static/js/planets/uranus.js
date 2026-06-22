// 天王星 3D 场景模块

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let uranus, clouds, atmosphere;
let moons = [];  // 5 颗主要卫星
let moonOrbits = [];  // 卫星轨道
let animationFrameId = null;

// 清除当前场景
function clearCurrentScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;
    container.innerHTML = '';
}

// 初始化天王星场景
export function initUranusScene() {
    clearUranusScene();
    clearCurrentScene();

    const container = document.getElementById('scene-container');
    if (!container) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 18);  // 调远一点，看清整个轨道
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;

    // 灯光
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    createStarfield();
    createUranus();
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

// 创建天王星
function createUranus() {
    const geometry = new THREE.SphereGeometry(1.8, 64, 64);

    // 创建天王星纹理
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 天王星基础颜色（青蓝色）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#6dd5ed');
    gradient.addColorStop(0.3, '#5bc0de');
    gradient.addColorStop(0.5, '#4fd0e7');
    gradient.addColorStop(0.7, '#5bc0de');
    gradient.addColorStop(1, '#6dd5ed');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ========== 大气特征 ==========

    // 1. 大气带（横向条纹，非常淡）
    for (let i = 0; i < 20; i++) {
        const y = (canvas.height / 20) * i;
        const height = Math.random() * 30 + 15;
        const alpha = Math.random() * 0.15 + 0.05;
        
        ctx.fillStyle = `rgba(100, 200, 220, ${alpha})`;
        ctx.fillRect(0, y, canvas.width, height);
    }

    // 2. 淡色云层
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 80 + 40;
        const alpha = Math.random() * 0.2 + 0.05;
        
        const cloudGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        cloudGradient.addColorStop(0, `rgba(180, 230, 240, ${alpha})`);
        cloudGradient.addColorStop(1, 'rgba(180, 230, 240, 0)');
        
        ctx.fillStyle = cloudGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. 极地区域（稍暗）
    // 北极
    const northPoleGradient = ctx.createRadialGradient(1024, 50, 0, 1024, 50, 300);
    northPoleGradient.addColorStop(0, 'rgba(80, 160, 180, 0.3)');
    northPoleGradient.addColorStop(1, 'rgba(80, 160, 180, 0)');
    ctx.fillStyle = northPoleGradient;
    ctx.beginPath();
    ctx.ellipse(1024, 50, 400, 150, 0, 0, Math.PI * 2);
    ctx.fill();

    // 南极
    const southPoleGradient = ctx.createRadialGradient(1024, 974, 0, 1024, 974, 300);
    southPoleGradient.addColorStop(0, 'rgba(80, 160, 180, 0.3)');
    southPoleGradient.addColorStop(1, 'rgba(80, 160, 180, 0)');
    ctx.fillStyle = southPoleGradient;
    ctx.beginPath();
    ctx.ellipse(1024, 974, 400, 150, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. 暗色斑点（大气风暴）
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 60 + 30;
        const ry = Math.random() * 40 + 20;
        const alpha = Math.random() * 0.15 + 0.05;
        
        ctx.fillStyle = `rgba(60, 140, 160, ${alpha})`;
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
        shininess: 25
    });

    uranus = new THREE.Mesh(geometry, material);
    
    // 天王星轴倾角 97.8°（躺着自转）
    uranus.rotation.z = 97.8 * Math.PI / 180;
    // 初始旋转角度
    uranus.rotation.y = 0;
    
    scene.add(uranus);

    // 外层大气（半透明）
    const atmosphereGeometry = new THREE.SphereGeometry(1.85, 64, 64);
    const atmosphereCanvas = document.createElement('canvas');
    atmosphereCanvas.width = 512;
    atmosphereCanvas.height = 256;
    const atmosphereCtx = atmosphereCanvas.getContext('2d');
    atmosphereCtx.fillStyle = 'rgba(0, 0, 0, 0)';
    atmosphereCtx.fillRect(0, 0, atmosphereCanvas.width, atmosphereCanvas.height);

    // 绘制淡蓝色大气
    const atmoGradient = atmosphereCtx.createRadialGradient(256, 128, 0, 256, 128, 256);
    atmoGradient.addColorStop(0, 'rgba(100, 220, 240, 0.1)');
    atmoGradient.addColorStop(0.8, 'rgba(100, 220, 240, 0.05)');
    atmoGradient.addColorStop(1, 'rgba(100, 220, 240, 0)');
    
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
    uranus.add(atmosphere);  // 大气层作为天王星的子对象，跟随天王星倾角
}

// 创建 5 颗主要卫星
function createMoons() {
    // 5 颗主要卫星的数据（逆时针旋转，速度为负，调慢一点）
    const moonsData = [
        { name: 'miranda', distance: 3.2, size: 0.12, color: 0xb8c4d6, speed: -0.008 },  // 天卫一
        { name: 'ariel', distance: 4.0, size: 0.15, color: 0xc8d0d8, speed: -0.006 },    // 天卫二
        { name: 'umbriel', distance: 5.0, size: 0.14, color: 0x98a0a8, speed: -0.004 }, // 天卫五
        { name: 'titania', distance: 6.2, size: 0.18, color: 0xb0b8c0, speed: -0.003 }, // 天卫三（最大）
        { name: 'oberon', distance: 7.5, size: 0.17, color: 0xa8b0b8, speed: -0.002 }   // 天卫四
    ];

    moonsData.forEach(data => {
        // 创建卫星
        const moonGeometry = new THREE.SphereGeometry(data.size, 16, 16);
        const moonMaterial = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.9,
            metalness: 0.1
        });

        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.userData = {
            distance: data.distance,
            speed: data.speed,  // 正数表示逆时针
            angle: Math.random() * Math.PI * 2
        };

        scene.add(moon);
        moons.push(moon);

        // 创建轨道
        const orbit = createMoonOrbit(data.distance);
        scene.add(orbit);
        moonOrbits.push(orbit);
    });
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

    if (!uranus || !scene || !camera || !renderer) return;

    // 天王星自转（17 小时 14 分一圈）
    uranus.rotation.y += 0.003;

    // 卫星公转（逆时针）
    moons.forEach(moon => {
        moon.userData.angle += moon.userData.speed;
        const angle = moon.userData.angle;
        const distance = moon.userData.distance;
        moon.position.x = Math.cos(angle) * distance;
        moon.position.z = Math.sin(angle) * distance;
        moon.position.y = 0;
        moon.rotation.y += 0.002;
    });

    controls.update();
    renderer.render(scene, camera);
}

// 清除天王星场景
export function clearUranusScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // 清理事件监听
    window.removeEventListener('resize', onWindowResize);

    // 释放纹理资源
    if (uranus && uranus.material) {
        if (uranus.material.map) {
            uranus.material.map.dispose();
        }
        uranus.material.dispose();
    }
    if (atmosphere && atmosphere.material) {
        if (atmosphere.material.map) {
            atmosphere.material.map.dispose();
        }
        atmosphere.material.dispose();
    }
    moons.forEach(moon => {
        if (moon && moon.material) {
            moon.material.dispose();
        }
    });

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
    uranus = null;
    clouds = null;
    moons = [];
    moonOrbits = [];
    animationFrameId = null;
}
