// 木卫四 3D 场景模块

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let callisto;
let animationFrameId = null;

function clearCurrentScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;
    container.innerHTML = '';
}

export function initCallistoScene() {
    clearCallistoScene();
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

    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    createStarfield();
    createCallisto();
    animate();
}

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

function createCallisto() {
    const geometry = new THREE.SphereGeometry(1.12, 64, 64);

    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 木卫四基础颜色（灰褐色，古老表面）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#7a6f65');
    gradient.addColorStop(0.5, '#8a7f75');
    gradient.addColorStop(1, '#7a6f65');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 瓦尔哈拉撞击坑（多环结构）
    ctx.strokeStyle = 'rgba(100, 90, 80, 0.5)';
    ctx.lineWidth = 3;
    const centerX = 1000;
    const centerY = 500;
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, 100 + i * 80, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // 中心区域
    ctx.fillStyle = 'rgba(90, 80, 70, 0.6)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
    ctx.fill();

    // 2. 大型撞击坑
    ctx.fillStyle = 'rgba(70, 60, 50, 0.5)';
    const largeCraters = [
        {x: 600, y: 400, r: 80},
        {x: 1400, y: 350, r: 70},
        {x: 500, y: 650, r: 60},
        {x: 1500, y: 700, r: 75},
        {x: 300, y: 300, r: 50}
    ];
    largeCraters.forEach(crater => {
        ctx.beginPath();
        ctx.arc(crater.x, crater.y, crater.r, 0, Math.PI * 2);
        ctx.fill();
        // 撞击坑边缘
        ctx.strokeStyle = 'rgba(60, 50, 40, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(crater.x, crater.y, crater.r, 0, Math.PI * 2);
        ctx.stroke();
    });

    // 3. 密集小型撞击坑
    ctx.fillStyle = 'rgba(80, 70, 60, 0.4)';
    for (let i = 0; i < 400; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 20 + 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 4. 表面纹理（古老、斑驳）
    for (let i = 0; i < 600; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 4 + 1;
        const alpha = Math.random() * 0.3 + 0.1;
        const color = 90 + Math.random() * 40;
        ctx.fillStyle = `rgba(${color}, ${color - 10}, ${color - 20}, ${alpha})`;
        ctx.fillRect(x, y, size, size);
    }

    // 5. 暗色射线（撞击溅射物）
    ctx.strokeStyle = 'rgba(60, 50, 40, 0.3)';
    ctx.lineWidth = 1;
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

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshPhongMaterial({
        map: texture,
        bumpScale: 0.06,
        specular: new THREE.Color(0x222222),
        shininess: 5
    });

    callisto = new THREE.Mesh(geometry, material);
    callisto.rotation.z = 0;
    callisto.rotation.y = 0;
    scene.add(callisto);
}

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    animationFrameId = requestAnimationFrame(animate);
    if (!callisto || !scene || !camera || !renderer) return;
    callisto.rotation.y += 0.003;
    controls.update();
    renderer.render(scene, camera);
}

export function clearCallistoScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    window.removeEventListener('resize', onWindowResize);
    if (callisto && callisto.material) {
        if (callisto.material.map) callisto.material.map.dispose();
        callisto.material.dispose();
    }
    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
    }
    if (scene) scene.clear();
    scene = null;
    camera = null;
    renderer = null;
    controls = null;
    callisto = null;
    animationFrameId = null;
}
