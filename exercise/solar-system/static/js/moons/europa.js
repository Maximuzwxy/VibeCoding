// 木卫二 3D 场景模块

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let europa;
let animationFrameId = null;

function clearCurrentScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;
    container.innerHTML = '';
}

export function initEuropaScene() {
    clearEuropaScene();
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
    createEuropa();
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

function createEuropa() {
    const geometry = new THREE.SphereGeometry(0.73, 64, 64);

    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 木卫二基础颜色（冰白色，带浅褐色条纹）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#d4c8b8');
    gradient.addColorStop(0.3, '#e4d8c8');
    gradient.addColorStop(0.5, '#d4c8b8');
    gradient.addColorStop(0.7, '#e4d8c8');
    gradient.addColorStop(1, '#d4c8b8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 冰裂纹（深色线条）
    ctx.strokeStyle = 'rgba(140, 120, 100, 0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 100; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        const length = Math.random() * 300 + 100;
        const angle = Math.random() * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(
            startX + Math.cos(angle) * length,
            startY + Math.sin(angle) * length
        );
        ctx.stroke();
    }

    // 2. 脊线（平行线条）
    ctx.strokeStyle = 'rgba(160, 140, 120, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 80; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        const length = Math.random() * 200 + 80;
        const angle = Math.random() * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let j = 0; j < 5; j++) {
            ctx.lineTo(
                startX + Math.cos(angle) * (length + j * 10),
                startY + Math.sin(angle) * (length + j * 10)
            );
        }
        ctx.stroke();
    }

    // 3. 暗色区域（冰下物质）
    ctx.fillStyle = 'rgba(120, 100, 80, 0.3)';
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 100 + 50;
        const ry = Math.random() * 70 + 30;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 4. 亮色区域（新鲜冰层）
    ctx.fillStyle = 'rgba(240, 235, 225, 0.4)';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 80 + 40;
        const ry = Math.random() * 60 + 25;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 5. 小型撞击坑
    ctx.fillStyle = 'rgba(100, 90, 80, 0.4)';
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 15 + 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshPhongMaterial({
        map: texture,
        bumpScale: 0.04,
        specular: new THREE.Color(0x333333),
        shininess: 20
    });

    europa = new THREE.Mesh(geometry, material);
    europa.rotation.z = 0;
    europa.rotation.y = 0;
    scene.add(europa);
}

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    animationFrameId = requestAnimationFrame(animate);
    if (!europa || !scene || !camera || !renderer) return;
    europa.rotation.y += 0.003;
    controls.update();
    renderer.render(scene, camera);
}

export function clearEuropaScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    window.removeEventListener('resize', onWindowResize);
    if (europa && europa.material) {
        if (europa.material.map) europa.material.map.dispose();
        europa.material.dispose();
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
    europa = null;
    animationFrameId = null;
}
