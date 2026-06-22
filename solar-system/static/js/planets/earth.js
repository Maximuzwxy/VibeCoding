// 地球 3D 场景模块

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let earth, clouds, moon;
let moonOrbit;
let animationFrameId = null;  // 动画帧 ID

// 清除当前场景
function clearCurrentScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;
    container.innerHTML = '';
}

// 初始化地球场景
export function initEarthScene() {
    // 先清除旧场景
    clearEarthScene();

    // 清除现有场景
    clearCurrentScene();

    // 创建场景容器
    const container = document.getElementById('scene-container');
    if (!container) return;

    // 创建场景
    scene = new THREE.Scene();

    // 创建相机
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 6);
    camera.lookAt(0, 0, 0);

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 创建控制器
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

    // 创建星空背景
    createStarfield();

    // 创建地球
    createEarth();

    // 创建月球
    createMoon();

    // 开始动画
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

// 创建地球
function createEarth() {
    // 地球几何体
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    // 创建地球纹理
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 海洋基础颜色（深蓝色）
    ctx.fillStyle = '#1a4d7c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ========== 大陆板块（绿色） ==========
    ctx.fillStyle = '#2d5a1e';

    // 1. 亚欧大陆（大椭圆）
    ctx.beginPath();
    ctx.ellipse(1150, 280, 280, 90, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. 日本（亚欧大陆东侧，小椭圆）
    ctx.beginPath();
    ctx.ellipse(1520, 290, 15, 40, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 3. 台湾省（日本南侧，更小的椭圆）
    ctx.beginPath();
    ctx.ellipse(1480, 340, 12, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 4. 印尼（亚欧大陆东南侧，椭圆）
    ctx.beginPath();
    ctx.ellipse(1450, 480, 100, 25, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // 5. 大洋洲（印尼东南侧，椭圆）
    ctx.beginPath();
    ctx.ellipse(1580, 620, 100, 70, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 6. 北美洲（椭圆）
    ctx.beginPath();
    ctx.ellipse(380, 260, 130, 90, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 7. 南美洲（北美洲东南侧，椭圆）
    ctx.beginPath();
    ctx.ellipse(560, 560, 70, 120, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 8. 非洲（亚欧大陆南侧，椭圆）
    ctx.beginPath();
    ctx.ellipse(1020, 480, 90, 110, 0, 0, Math.PI * 2);
    ctx.fill();

    // 9. 北极冰盖（白色，椭圆）
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(1024, 40, 280, 35, 0, 0, Math.PI * 2);
    ctx.fill();

    // 10. 南极洲（白色，椭圆）
    ctx.beginPath();
    ctx.ellipse(1024, 980, 380, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // ========== 地形细节 ==========
    // 沙漠（暗黄色，非洲北部和中亚）
    ctx.fillStyle = '#c4a35a';
    ctx.beginPath();
    ctx.ellipse(1050, 420, 80, 40, 0, 0, Math.PI * 2);  // 撒哈拉
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1200, 320, 60, 35, 0, 0, Math.PI * 2);  // 中亚沙漠
    ctx.fill();

    // 山脉（深褐色）
    ctx.fillStyle = 'rgba(101, 67, 33, 0.6)';
    ctx.beginPath();
    ctx.ellipse(1280, 340, 50, 15, 0, 0, Math.PI * 2);  // 喜马拉雅山脉
    ctx.fill();

    // 随机地形细节（绿色斑点）
    ctx.fillStyle = 'rgba(45, 90, 30, 0.4)';
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 25 + 8;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
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

    earth = new THREE.Mesh(geometry, material);
    
    // 地球轴倾角 23.4°
    earth.rotation.z = 23.4 * Math.PI / 180;
    // 初始旋转角度
    earth.rotation.y = 0;
    
    scene.add(earth);

    // 云层（在地球外面一层）
    const cloudGeometry = new THREE.SphereGeometry(1.02, 64, 64);
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 1024;
    cloudCanvas.height = 512;
    const cloudCtx = cloudCanvas.getContext('2d');
    cloudCtx.fillStyle = 'rgba(0, 0, 0, 0)';
    cloudCtx.fillRect(0, 0, cloudCanvas.width, cloudCanvas.height);

    // 绘制云层
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * cloudCanvas.width;
        const y = Math.random() * cloudCanvas.height;
        const radius = Math.random() * 40 + 20;
        const alpha = Math.random() * 0.4 + 0.1;
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
    earth.add(clouds);  // 云层作为地球的子对象，跟随地球倾角
}

// 创建月球
function createMoon() {
    // 月球轨道距离
    const moonDistance = 2.5;

    // 创建月球
    const moonGeometry = new THREE.SphereGeometry(0.18, 32, 32);
    const moonMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.8,
        metalness: 0.2
    });
    
    moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.userData = {
        distance: moonDistance,
        speed: -0.005,
        angle: Math.random() * Math.PI * 2
    };
    
    scene.add(moon);
    
    // 创建月球轨道
    moonOrbit = createMoonOrbit(moonDistance);
    scene.add(moonOrbit);
}

// 创建月球轨道
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
        color: 0x888888,
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

    if (!earth || !scene || !camera || !renderer) return;

    // 地球自转（云层作为子对象会跟随）
    earth.rotation.y += 0.003;

    // 月球公转
    if (moon) {
        moon.userData.angle += moon.userData.speed;
        moon.position.x = Math.cos(moon.userData.angle) * moon.userData.distance;
        moon.position.z = Math.sin(moon.userData.angle) * moon.userData.distance;
        moon.rotation.y += 0.001;
    }

    controls.update();
    renderer.render(scene, camera);
}

// 清除地球场景
export function clearEarthScene() {
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
    if (earth && earth.material) {
        if (earth.material.map) {
            earth.material.map.dispose();
        }
        earth.material.dispose();
    }
    if (clouds && clouds.material) {
        if (clouds.material.map) {
            clouds.material.map.dispose();
        }
        clouds.material.dispose();
    }
    if (moon && moon.material) {
        moon.material.dispose();
    }

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
    earth = null;
    clouds = null;
    moon = null;
    moonOrbit = null;
    animationFrameId = null;
}
