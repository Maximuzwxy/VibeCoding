// 木星 3D 场景模块

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let jupiter, clouds;
let satellites = [], satelliteOrbits = [];
let animationFrameId = null;  // 动画帧 ID

// 伽利略卫星数据（速度更慢，尺寸稍大）
const moonsData = [
    { name: '木卫一 Io', radius: 0.12, distance: 1.8, color: 0xffffcc, speed: -0.006, info: '最活跃的火山卫星' },
    { name: '木卫二 Europa', radius: 0.11, distance: 2.4, color: 0xccddff, speed: -0.0045, info: '冰层下有海洋' },
    { name: '木卫三 Ganymede', radius: 0.15, distance: 3.0, color: 0xaaaaaa, speed: -0.003, info: '太阳系最大卫星' },
    { name: '木卫四 Callisto', radius: 0.14, distance: 3.6, color: 0x886644, speed: -0.002, info: '表面布满陨石坑' }
];

// 清除当前场景
function clearCurrentScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;
    container.innerHTML = '';
}

// 初始化木星场景
export function initJupiterScene() {
    // 先清除旧场景
    clearJupiterScene();

    // 清除现有场景
    clearCurrentScene();

    // 创建场景容器
    const container = document.getElementById('scene-container');
    if (!container) return;

    // 创建场景
    scene = new THREE.Scene();

    // 创建相机（放大视角，让木星看起来更大）
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 0, 0);

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 创建控制器（调整范围，让木星看起来更大）
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 20;

    // 灯光（与 planets/jupiter.js 一致）
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // 创建星空背景
    createStarfield();

    // 创建木星
    createJupiter();

    // 创建伽利略卫星
    createMoons();

    // 开始动画
    animate();
}

// 创建星空背景（与 planets/jupiter.js 一致）
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
    ctx.arc(16, 16, 16, 0, Math.PI * 2);  // 半径 16，填满整个纹理
    ctx.fillStyle = 'white';
    ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);

    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.3,  // 增大星星大小
        sizeAttenuation: true,
        map: texture,
        transparent: true,
        alphaTest: 0.5
    });

    scene.add(new THREE.Points(starsGeometry, starsMaterial));
}

// 创建木星（与 planets/jupiter.js 完全一致）
function createJupiter() {
    // 木星几何体
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    // 创建木纹纹理
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 基础颜色
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#c9a86c');
    gradient.addColorStop(0.1, '#b8956a');
    gradient.addColorStop(0.2, '#a67c52');
    gradient.addColorStop(0.3, '#d4b896');
    gradient.addColorStop(0.4, '#c9a86c');
    gradient.addColorStop(0.5, '#b8956a');
    gradient.addColorStop(0.6, '#a67c52');
    gradient.addColorStop(0.7, '#d4b896');
    gradient.addColorStop(0.8, '#c9a86c');
    gradient.addColorStop(0.9, '#b8956a');
    gradient.addColorStop(1, '#a67c52');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 条纹带
    const bands = [
        { y: 100, height: 80, color: 'rgba(139, 90, 43, 0.4)' },
        { y: 250, height: 60, color: 'rgba(160, 82, 45, 0.3)' },
        { y: 400, height: 100, color: 'rgba(139, 69, 19, 0.35)' },
        { y: 550, height: 70, color: 'rgba(160, 82, 45, 0.4)' },
        { y: 700, height: 90, color: 'rgba(139, 90, 43, 0.35)' },
        { y: 850, height: 60, color: 'rgba(160, 82, 45, 0.3)' },
    ];
    bands.forEach(band => {
        ctx.fillStyle = band.color;
        ctx.fillRect(0, band.y, canvas.width, band.height);
    });

    // 大红斑
    ctx.beginPath();
    ctx.ellipse(1700, 580, 80, 50, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(178, 34, 34, 0.6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 0, 0, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 涡流细节
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 20 + 5;
        const alpha = Math.random() * 0.2 + 0.1;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const material = new THREE.MeshPhongMaterial({
        map: texture,
        bumpScale: 0.05,
        specular: new THREE.Color(0x333333),
        shininess: 15
    });

    jupiter = new THREE.Mesh(geometry, material);
    
    // 木星轴倾角 3.1°（很小的倾角）
    jupiter.rotation.z = 3.1 * Math.PI / 180;
    // 初始旋转角度
    jupiter.rotation.y = 0;
    
    scene.add(jupiter);

    // 云层
    const cloudGeometry = new THREE.SphereGeometry(1.02, 64, 64);
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 1024;
    cloudCanvas.height = 512;
    const cloudCtx = cloudCanvas.getContext('2d');
    cloudCtx.fillStyle = 'rgba(0, 0, 0, 0)';
    cloudCtx.fillRect(0, 0, cloudCanvas.width, cloudCanvas.height);

    for (let i = 0; i < 300; i++) {
        const x = Math.random() * cloudCanvas.width;
        const y = Math.random() * cloudCanvas.height;
        const radius = Math.random() * 50 + 20;
        const alpha = Math.random() * 0.3 + 0.1;
        const gradient = cloudCtx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        cloudCtx.beginPath();
        cloudCtx.arc(x, y, radius, 0, Math.PI * 2);
        cloudCtx.fillStyle = gradient;
        cloudCtx.fill();
    }

    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    const cloudMaterial = new THREE.MeshPhongMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    });

    clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(clouds);
}

// 创建伽利略卫星（与 planets/jupiter.js 一致）
function createMoons() {
    moonsData.forEach(moon => {
        // 创建卫星
        const geometry = new THREE.SphereGeometry(moon.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: moon.color,
            roughness: 0.8,
            metalness: 0.2
        });

        const satellite = new THREE.Mesh(geometry, material);
        satellite.userData = {
            distance: moon.distance,
            speed: moon.speed,
            angle: Math.random() * Math.PI * 2
        };

        scene.add(satellite);
        satellites.push(satellite);

        // 创建轨道
        const orbit = createOrbit(moon.distance);
        scene.add(orbit);
        satelliteOrbits.push(orbit);
    });
}

// 创建轨道（青色，半透明）
function createOrbit(distance) {
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
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.3
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

// 动画循环（与 planets/jupiter.js 一致）
function animate() {
    animationFrameId = requestAnimationFrame(animate);

    if (!jupiter || !scene || !camera || !renderer) return;

    // 木星自转
    jupiter.rotation.y += 0.002;
    if (clouds) {
        clouds.rotation.y += 0.0025;
    }

    // 卫星公转（逆时针，负速度）
    satellites.forEach(satellite => {
        satellite.userData.angle += satellite.userData.speed;
        satellite.position.x = Math.cos(satellite.userData.angle) * satellite.userData.distance;
        satellite.position.z = Math.sin(satellite.userData.angle) * satellite.userData.distance;
    });

    controls.update();
    renderer.render(scene, camera);
}

// 清除木星场景（返回太阳系）
export function clearJupiterScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;

    // 取消动画帧
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // 清理事件监听
    window.removeEventListener('resize', onWindowResize);

    // 释放纹理资源
    if (jupiter && jupiter.material) {
        if (jupiter.material.map) {
            jupiter.material.map.dispose();
        }
        jupiter.material.dispose();
    }
    if (clouds && clouds.material) {
        if (clouds.material.map) {
            clouds.material.map.dispose();
        }
        clouds.material.dispose();
    }
    satellites.forEach(satellite => {
        if (satellite && satellite.material) {
            satellite.material.dispose();
        }
    });

    // 清除 Three.js 资源
    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
    }
    if (scene) {
        scene.clear();
    }

    // 重置全局变量
    scene = null;
    camera = null;
    renderer = null;
    controls = null;
    jupiter = null;
    clouds = null;
    satellites = [];
    satelliteOrbits = [];
    animationFrameId = null;
}
