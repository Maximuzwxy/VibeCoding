// 火卫一 3D 场景模块

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let phobos;
let animationFrameId = null;

// 清除当前场景
function clearCurrentScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;
    container.innerHTML = '';
}

// 初始化火卫一场景
export function initPhobosScene() {
    clearPhobosScene();
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
    createPhobos();

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

// 创建火卫一（不规则形状）
function createPhobos() {
    // 使用椭球体模拟不规则形状
    const geometry = new THREE.SphereGeometry(0.7, 32, 32);
    
    // 变形为椭球
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i] *= 1.3;      // X 轴拉长
        positions[i + 1] *= 1.0;  // Y 轴不变
        positions[i + 2] *= 0.9;  // Z 轴压扁
    }
    geometry.computeVertexNormals();

    // 创建火卫一纹理
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 火卫一基础颜色（灰褐色）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#7b6b55');
    gradient.addColorStop(0.5, '#8b7355');
    gradient.addColorStop(1, '#7b6b55');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ========== 地表特征 ==========

    // 1. 斯蒂克尼撞击坑（最大撞击坑）
    ctx.fillStyle = '#6b5b45';
    ctx.beginPath();
    ctx.arc(600, 260, 80, 0, Math.PI * 2);
    ctx.fill();
    
    // 撞击坑边缘
    ctx.strokeStyle = '#5b4b35';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(600, 260, 80, 0, Math.PI * 2);
    ctx.stroke();

    // 2. 小型撞击坑（密集分布）
    for (let i = 0; i < 150; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 25 + 5;
        const alpha = Math.random() * 0.4 + 0.1;
        
        ctx.fillStyle = `rgba(${90 + Math.random() * 30}, ${75 + Math.random() * 25}, ${60 + Math.random() * 20}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. 沟槽（火卫一特征）
    ctx.strokeStyle = 'rgba(100, 85, 70, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 30; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        const length = Math.random() * 150 + 50;
        const angle = Math.random() * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(
            startX + Math.cos(angle) * length,
            startY + Math.sin(angle) * length
        );
        ctx.stroke();
    }

    // 4. 表面纹理（粗糙）
    for (let i = 0; i < 500; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 3 + 1;
        const alpha = Math.random() * 0.3 + 0.1;
        
        ctx.fillStyle = `rgba(${100 + Math.random() * 50}, ${85 + Math.random() * 40}, ${70 + Math.random() * 30}, ${alpha})`;
        ctx.fillRect(x, y, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const material = new THREE.MeshPhongMaterial({
        map: texture,
        bumpScale: 0.08,
        specular: new THREE.Color(0x111111),
        shininess: 3
    });

    phobos = new THREE.Mesh(geometry, material);
    
    // 火卫一轴倾角很小
    phobos.rotation.z = 0;
    phobos.rotation.y = 0;
    
    scene.add(phobos);
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

    if (!phobos || !scene || !camera || !renderer) return;

    // 火卫一自转（逆时针，参考金星速度）
    phobos.rotation.y += 0.003;

    controls.update();
    renderer.render(scene, camera);
}

// 清除火卫一场景
export function clearPhobosScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    window.removeEventListener('resize', onWindowResize);

    if (phobos && phobos.material) {
        if (phobos.material.map) {
            phobos.material.map.dispose();
        }
        phobos.material.dispose();
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
    phobos = null;
    animationFrameId = null;
}
