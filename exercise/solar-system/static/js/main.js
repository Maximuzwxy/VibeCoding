// 太阳系主场景
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let sun, planets = [], orbits = [];
let asteroidBelt;
let speedMultiplier = 1;

const planetData = [
    { name: '水星', radius: 0.4, distance: 4, color: 0xb5b5b5, speed: -0.04 },
    { name: '金星', radius: 0.6, distance: 6, color: 0xffc649, speed: -0.015 },
    { name: '地球', radius: 0.65, distance: 8, color: 0x4da6ff, speed: -0.01 },
    { name: '火星', radius: 0.5, distance: 10, color: 0xc15a3a, speed: -0.008 },
    { name: '木星', radius: 1.5, distance: 14, color: 0xd8ca9d, speed: -0.002 },
    { name: '土星', radius: 1.2, distance: 18, color: 0xead6b8, speed: -0.0009, hasRings: true },
    { name: '天王星', radius: 0.9, distance: 22, color: 0x4fd0e7, speed: -0.0004 },
    { name: '海王星', radius: 0.85, distance: 26, color: 0x2244ff, speed: -0.0001 }
];

init();
createSolarSystem();
animate();

function init() {
    // 创建场景容器
    const container = document.createElement('div');
    container.id = 'scene-container';
    document.body.insertBefore(container, document.body.firstChild);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 50);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 200;
    controls.target.set(0, 0, 0);

    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 1.5, 300);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    createStarfield();
    createAsteroidBelt();

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onMouseClick);
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
        size: 0.35,  // 增大星星大小
        sizeAttenuation: true,
        map: texture,
        transparent: true,
        alphaTest: 0.5
    });

    scene.add(new THREE.Points(starsGeometry, starsMaterial));
}

// 创建小行星带
function createAsteroidBelt() {
    const asteroidCount = 5000;
    const innerRadius = 10.5;
    const outerRadius = 13.5;

    const asteroidsGeometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    const color1 = new THREE.Color(0xaaaaaa);
    const color2 = new THREE.Color(0x887755);
    const color3 = new THREE.Color(0x666666);

    for (let i = 0; i < asteroidCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
        const height = (Math.random() - 0.5) * 0.8;

        const x = Math.cos(angle) * radius;
        const y = height;
        const z = Math.sin(angle) * radius;

        positions.push(x, y, z);

        const rand = Math.random();
        const color = rand > 0.6 ? color1 : (rand > 0.3 ? color2 : color3);
        colors.push(color.r, color.g, color.b);
    }

    asteroidsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    asteroidsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const asteroidsMaterial = new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true
    });

    asteroidBelt = new THREE.Points(asteroidsGeometry, asteroidsMaterial);
    scene.add(asteroidBelt);
}

function createSolarSystem() {
    // 创建太阳
    const sunGeometry = new THREE.SphereGeometry(2, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // 太阳光晕
    const glowGeometry = new THREE.SphereGeometry(2.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.3
    });
    sun.add(new THREE.Mesh(glowGeometry, glowMaterial));

    // 创建行星
    planetData.forEach(data => {
        const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.8,
            metalness: 0.2
        });

        const planet = new THREE.Mesh(geometry, material);
        planet.userData = { name: data.name, distance: data.distance };

        // 土星环
        if (data.hasRings) {
            const ringGeo = new THREE.RingGeometry(data.radius * 1.5, data.radius * 2.5, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xc9b896,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            planet.add(ring);
        }

        scene.add(planet);
        planets.push({
            mesh: planet,
            distance: data.distance,
            speed: data.speed,
            angle: Math.random() * Math.PI * 2
        });

        // 创建轨道
        const orbit = createOrbit(data.distance);
        orbits.push(orbit);
    });
}

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
        color: 0x888888,
        transparent: true,
        opacity: 0.5
    });

    const orbit = new THREE.Line(geometry, material);
    scene.add(orbit);
    return orbit;
}

function onMouseClick(event) {
    // 如果点击的是弹窗内部，不处理
    if (event.target.closest('#jupiter-modal')) return;

    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

    if (intersects.length > 0) {
        const planet = intersects[0].object;
        const planetName = planet.userData.name;

        // 点击行星时显示提示
        alert(`${planetName}\n距离太阳：${planet.userData.distance} AU\n\n点击底部的木星图标进入木星探索模式`);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    sun.rotation.y += 0.001;

    planets.forEach(planet => {
        planet.angle += planet.speed * speedMultiplier;
        planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
        planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
        planet.mesh.rotation.y += 0.01;
    });

    if (asteroidBelt) {
        asteroidBelt.rotation.y += 0.0003 * speedMultiplier;
    }

    controls.update();
    renderer.render(scene, camera);
}

// 清除太阳系场景（导出给 planet-selector 使用）
export function clearSolarSystemScene() {
    const container = document.getElementById('scene-container');
    if (!container) return;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    window.removeEventListener('resize', onWindowResize);

    // 释放纹理和材质
    if (sun && sun.material) {
        sun.material.dispose();
    }
    planets.forEach(planet => {
        if (planet.mesh && planet.mesh.material) {
            planet.mesh.material.dispose();
        }
    });
    if (asteroidBelt && asteroidBelt.material) {
        asteroidBelt.material.dispose();
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
    sun = null;
    planets = [];
    orbits = [];
    asteroidBelt = null;
    animationFrameId = null;
}
