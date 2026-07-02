// 土卫六 3D 场景模块

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let titan;
let animationFrameId = null;

// 清除当前场景
function clearCurrentScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;
    container.innerHTML = '';
}

// 初始化土卫六场景
export function initTitanScene() {
    clearTitanScene();
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
    createTitan();

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

// 创建土卫六
function createTitan() {
    const geometry = new THREE.SphereGeometry(0.9, 64, 64);

    // 创建土卫六纹理
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 土卫六基础颜色（橙黄色，浓厚大气）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#c4a87c');
    gradient.addColorStop(0.3, '#d4b88c');
    gradient.addColorStop(0.5, '#e0c89c');
    gradient.addColorStop(0.7, '#d4b88c');
    gradient.addColorStop(1, '#c4a87c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ========== 大气特征 ==========

    // 1. 大气雾霾层（半透明橙色）
    ctx.fillStyle = 'rgba(200, 170, 120, 0.2)';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 150 + 80;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(220, 190, 140, 0.3)');
        gradient.addColorStop(1, 'rgba(220, 190, 140, 0)');
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. 暗色区域（碳氢化合物沙丘）
    ctx.fillStyle = 'rgba(120, 100, 70, 0.4)';
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const y = 400 + Math.random() * 224;  // 赤道区域
        const rx = Math.random() * 150 + 80;
        const ry = Math.random() * 60 + 30;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. 亮色区域（冰质地表）
    ctx.fillStyle = 'rgba(230, 210, 180, 0.3)';
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 120 + 60;
        const ry = Math.random() * 80 + 40;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 4. 甲烷湖泊（暗色区域，主要在极地）
    ctx.fillStyle = 'rgba(60, 50, 40, 0.5)';
    
    // 克拉肯海（最大湖泊，北极）
    ctx.beginPath();
    ctx.ellipse(1024, 150, 250, 120, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 丽姬亚海
    ctx.beginPath();
    ctx.ellipse(900, 180, 120, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 蓬加海
    ctx.beginPath();
    ctx.ellipse(1150, 170, 100, 70, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5. 大气条纹（橙色带状）
    ctx.fillStyle = 'rgba(210, 180, 130, 0.25)';
    for (let i = 0; i < 20; i++) {
        const y = (canvas.height / 20) * i;
        const height = Math.random() * 40 + 20;
        ctx.fillRect(0, y, canvas.width, height);
    }

    // 6. 云层（淡橙色）
    ctx.fillStyle = 'rgba(240, 220, 190, 0.3)';
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 100 + 50;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(240, 220, 190, 0.4)');
        gradient.addColorStop(1, 'rgba(240, 220, 190, 0)');
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
        specular: new THREE.Color(0x222222),
        shininess: 20
    });

    titan = new THREE.Mesh(geometry, material);
    
    // 土卫六轴倾角很小（约 0.3 度）
    titan.rotation.z = 0.3 * Math.PI / 180;
    // 初始旋转角度
    titan.rotation.y = 0;
    
    scene.add(titan);
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

    if (!titan || !scene || !camera || !renderer) return;

    // 土卫六自转（逆时针，参考金星速度）
    titan.rotation.y += 0.003;

    controls.update();
    renderer.render(scene, camera);
}

// 清除土卫六场景
export function clearTitanScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // 清理事件监听
    window.removeEventListener('resize', onWindowResize);

    // 释放纹理资源
    if (titan && titan.material) {
        if (titan.material.map) {
            titan.material.map.dispose();
        }
        titan.material.dispose();
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
    titan = null;
    animationFrameId = null;
}
