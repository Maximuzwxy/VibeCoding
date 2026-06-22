// 土星 3D 场景模块

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let saturn, saturnGroup, rings;
let moons = [];  // 7 颗主要卫星
let moonOrbits = [];  // 卫星轨道
let animationFrameId = null;

// 清除当前场景
function clearCurrentScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;
    container.innerHTML = '';
}

// 初始化土星场景
export function initSaturnScene() {
    clearSaturnScene();
    clearCurrentScene();

    const container = document.getElementById('scene-container');
    if (!container) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 35);  // 视角拉远，看清整个环和卫星轨道
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 80;

    // 灯光
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    createStarfield();
    saturnGroup = createSaturn();  // 创建土星并获取组
    createRings(saturnGroup);  // 创建环并添加到组
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

// 创建土星
function createSaturn() {
    const geometry = new THREE.SphereGeometry(2.5, 64, 64);

    // 创建土星纹理
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 土星基础颜色（淡黄色/米色）
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f0e6d0');
    gradient.addColorStop(0.2, '#e6d8b8');
    gradient.addColorStop(0.4, '#d4c8a8');
    gradient.addColorStop(0.5, '#ead6b8');
    gradient.addColorStop(0.6, '#d4c8a8');
    gradient.addColorStop(0.8, '#e6d8b8');
    gradient.addColorStop(1, '#f0e6d0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ========== 大气特征 ==========

    // 1. 大气带（横向条纹，不同深浅）
    for (let i = 0; i < 30; i++) {
        const y = (canvas.height / 30) * i;
        const height = Math.random() * 40 + 20;
        const alpha = Math.random() * 0.25 + 0.1;
        
        const bandColor = Math.random() > 0.5 
            ? `rgba(220, 200, 160, ${alpha})`
            : `rgba(180, 160, 120, ${alpha})`;
        
        ctx.fillStyle = bandColor;
        ctx.fillRect(0, y, canvas.width, height);
    }

    // 2. 淡色云层
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 100 + 50;
        const alpha = Math.random() * 0.2 + 0.08;
        
        const cloudGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        cloudGradient.addColorStop(0, `rgba(240, 230, 200, ${alpha})`);
        cloudGradient.addColorStop(1, 'rgba(240, 230, 200, 0)');
        
        ctx.fillStyle = cloudGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. 暗色风暴（小暗斑）
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 70 + 35;
        const ry = Math.random() * 45 + 22;
        const alpha = Math.random() * 0.25 + 0.1;
        
        ctx.fillStyle = `rgba(140, 120, 90, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 4. 白色风暴（明亮斑点）
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const rx = Math.random() * 60 + 30;
        const ry = Math.random() * 40 + 20;
        const alpha = Math.random() * 0.3 + 0.15;
        
        ctx.fillStyle = `rgba(250, 245, 230, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // 5. 极地区域（稍暗）
    // 北极
    const northPoleGradient = ctx.createRadialGradient(1024, 60, 0, 1024, 60, 300);
    northPoleGradient.addColorStop(0, 'rgba(180, 160, 130, 0.3)');
    northPoleGradient.addColorStop(1, 'rgba(180, 160, 130, 0)');
    ctx.fillStyle = northPoleGradient;
    ctx.beginPath();
    ctx.ellipse(1024, 60, 400, 150, 0, 0, Math.PI * 2);
    ctx.fill();

    // 南极
    const southPoleGradient = ctx.createRadialGradient(1024, 964, 0, 1024, 964, 300);
    southPoleGradient.addColorStop(0, 'rgba(180, 160, 130, 0.3)');
    southPoleGradient.addColorStop(1, 'rgba(180, 160, 130, 0)');
    ctx.fillStyle = southPoleGradient;
    ctx.beginPath();
    ctx.ellipse(1024, 964, 400, 150, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const material = new THREE.MeshPhongMaterial({
        map: texture,
        bumpScale: 0.05,
        specular: new THREE.Color(0x222222),
        shininess: 25
    });

    saturn = new THREE.Mesh(geometry, material);

    // 创建土星组，用于整体倾角
    const saturnGroup = new THREE.Group();
    // 设置土星轴倾角（26.7 度）
    saturnGroup.rotation.z = 26.7 * Math.PI / 180;
    
    // 初始旋转角度
    saturn.rotation.y = 0;
    
    saturnGroup.add(saturn);
    scene.add(saturnGroup);
    
    // 返回组，用于动画
    return saturnGroup;
}

// 创建土星环（使用 Points 几何体，像小行星带一样可以旋转）
function createRings(saturnGroup) {
    // 实际土星环比例：
    // 土星半径：2.5
    // 环内缘：约 1.24 倍土星半径 = 3.1
    // 环外缘：约 2.33 倍土星半径 = 5.8
    
    // 环的粒子数量 - 根据环带宽度分配不同密度
    const ringBands = [
        { inner: 3.1, outer: 3.6, density: 0.5, color: new THREE.Color(0xc8beb0), name: 'C' },   // C 环（暗，较稀疏）
        { inner: 3.6, outer: 4.5, density: 1.2, color: new THREE.Color(0xdcd2be), name: 'B' },   // B 环（亮，密集）
        { inner: 4.5, outer: 4.7, density: 0.1, color: new THREE.Color(0x908070), name: 'CF' },  // 卡西尼缝（很稀疏）
        { inner: 4.7, outer: 5.4, density: 0.9, color: new THREE.Color(0xd8d0b8), name: 'A' },   // A 环（较亮）
        { inner: 5.4, outer: 5.5, density: 0.15, color: new THREE.Color(0x807060), name: 'EF' }, // 恩克缝（很稀疏）
        { inner: 5.5, outer: 5.7, density: 0.5, color: new THREE.Color(0xc8c0a8), name: 'AO' },  // A 环外缘
        { inner: 5.7, outer: 5.85, density: 0.3, color: new THREE.Color(0xb0a890), name: 'F' }   // F 环（最外，稀疏）
    ];

    // 计算总权重
    let totalWeight = 0;
    ringBands.forEach(band => {
        totalWeight += (band.outer - band.inner) * band.density;
    });

    const totalParticles = 5000;
    const positions = [];
    const colors = [];

    ringBands.forEach(band => {
        // 根据密度和宽度计算该环带的粒子数
        const bandWeight = (band.outer - band.inner) * band.density;
        const bandParticles = Math.floor(totalParticles * (bandWeight / totalWeight));

        for (let i = 0; i < bandParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            // 在环带内均匀分布
            const radius = band.inner + Math.random() * (band.outer - band.inner);
            
            // 在 XZ 平面（赤道平面）上分布
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (Math.random() - 0.5) * 0.03;  // 非常薄的垂直分布

            positions.push(x, y, z);

            // 根据环带设置颜色，添加亮度变化
            const brightness = 0.7 + Math.random() * 0.4;  // 0.7-1.1
            colors.push(
                band.color.r * brightness,
                band.color.g * brightness,
                band.color.b * brightness
            );
        }
    });

    const ringGeometry = new THREE.BufferGeometry();
    ringGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    ringGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const ringMaterial = new THREE.PointsMaterial({
        size: 0.07,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });

    rings = new THREE.Points(ringGeometry, ringMaterial);

    // 环位于赤道平面（XZ 平面），垂直于自转轴
    // 因为环在土星组内，组的 rotation.z = 26.7° 会让环倾斜

    saturnGroup.add(rings);  // 添加到土星组，随土星一起倾斜和旋转
}

// 创建 7 颗主要卫星
function createMoons() {
    // 7 颗主要卫星的数据（顺时针旋转，速度为负，卫星大小为之前 2 倍）
    const moonsData = [
        { name: 'mimas', distance: 8.0, size: 0.24, color: 0xc0c0c0, speed: -0.005 },     // 土卫一
        { name: 'enceladus', distance: 9.0, size: 0.26, color: 0xd0d0d0, speed: -0.004 }, // 土卫二
        { name: 'tethys', distance: 10.2, size: 0.30, color: 0xc8c8c8, speed: -0.0035 },  // 土卫三
        { name: 'dione', distance: 11.5, size: 0.32, color: 0xb8b8b8, speed: -0.003 },    // 土卫四
        { name: 'rhea', distance: 13.5, size: 0.36, color: 0xb0b0b0, speed: -0.0025 },    // 土卫五
        { name: 'titan', distance: 18.0, size: 0.60, color: 0xd4b88c, speed: -0.002 },    // 土卫六（最大，橙黄色）
        { name: 'iapetus', distance: 28.0, size: 0.34, color: 0xa8a8a8, speed: -0.0015 }  // 土卫八（最远）
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
            speed: data.speed,
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
        opacity: 0.4
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

    if (!saturn || !scene || !camera || !renderer) return;

    // 土星自转（10 小时 42 分一圈）
    saturn.rotation.y += 0.004;
    
    // 土星环旋转（与土星自转一致，像小行星带一样）
    if (rings) {
        rings.rotation.y += 0.004;
    }

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

// 清除土星场景
export function clearSaturnScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // 清理事件监听
    window.removeEventListener('resize', onWindowResize);

    // 释放纹理资源
    if (saturn && saturn.material) {
        if (saturn.material.map) {
            saturn.material.map.dispose();
        }
        saturn.material.dispose();
    }
    if (rings && rings.material) {
        rings.material.dispose();
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
    saturn = null;
    saturnGroup = null;
    rings = null;
    moons = [];
    moonOrbits = [];
    animationFrameId = null;
}
