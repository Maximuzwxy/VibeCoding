/**
 * 太阳系主场景入口
 *
 * 支持两种模式：
 * 1. 太阳系全景（默认）：太阳居中，八大行星环绕
 * 2. 行星特写（点击 planet-icon）：行星居中，近距离观测，有纹理
 */

import * as THREE from 'three';
import { CelestialSystem } from './celestial-system.js';
import { createMercuryTexture } from './planets/mercury.js';
import { createVenusTexture, createVenusCloudTexture } from './planets/venus.js';
import { createEarthTexture, createEarthCloudTexture } from './planets/earth.js';
import { createMarsTexture, createMarsAtmosphereTexture } from './planets/mars.js';
import { createJupiterTexture, createJupiterCloudTexture } from './planets/jupiter.js';
import { createSaturnTexture, createSaturnRing } from './planets/saturn.js';
import { createUranusTexture, createUranusAtmosphereTexture } from './planets/uranus.js';
import { createNeptuneTexture, createNeptuneAtmosphereTexture } from './planets/neptune.js';
import { createMoonTexture } from './moons/moon.js';
import { createTiangongStation } from './moons/tiangong.js';
import { createIoTexture } from './moons/io.js';
import { createEuropaTexture } from './moons/europa.js';
import { createGanymedeTexture } from './moons/ganymede.js';
import { createCallistoTexture } from './moons/callisto.js';
import { createEnceladusTexture } from './moons/enceladus.js';
import { createMimasTexture } from './moons/mimas.js';
import { createTitanTexture } from './moons/titan.js';
import { createSaturnIceMoonTexture } from './moons/saturn-ice-moons.js';
import { createUranusIceMoonTexture } from './moons/uranus-ice-moons.js';
import { createTritonTexture } from './moons/triton.js';
import { createPhobosTexture } from './moons/phobos.js';
import { createDeimosTexture } from './moons/deimos.js';

// ==================== 场景状态 ====================

let currentSystem = null;    // 当前 CelestialSystem 实例
let currentMode = null;      // sun | mercury | venus | ...（初始 null 确保首次 switchScene 一定执行）

// ==================== 太阳系全景配置 ====================

const solarSystemConfig = {
    centerBody: {
        radius: 2,
        color: 0xffdd00,
        axialTilt: 7.25,
        glowColor: 0xff6600,
        glowOpacity: 0.3,
        glowSize: 2.5
    },
    orbitingBodies: [
        { name: 'mercury', radius: 0.4, distance: 4, color: '#b5b5b5', speed: -0.04, axialTilt: 0.03, rotationSpeed: 0.005, textureGenerator: createMercuryTexture },
        { name: 'venus', radius: 0.6, distance: 6, color: '#ffc649', speed: -0.015, axialTilt: 177.4, rotationSpeed: 0.002, textureGenerator: createVenusTexture },
        { name: 'earth', radius: 0.65, distance: 8, color: '#4da6ff', speed: -0.01, axialTilt: 23.44, rotationSpeed: 0.01, textureGenerator: createEarthTexture },
        { name: 'mars', radius: 0.5, distance: 10, color: '#c15a3a', speed: -0.008, axialTilt: 25.19, rotationSpeed: 0.01, textureGenerator: createMarsTexture },
        { name: 'jupiter', radius: 1.5, distance: 14, color: '#d8ca9d', speed: -0.002, axialTilt: 3.13, rotationSpeed: 0.015, textureGenerator: createJupiterTexture },
        { name: 'saturn', radius: 1.2, distance: 18, color: '#ead6b8', speed: -0.0009, axialTilt: 26.73, rotationSpeed: 0.01, hasRings: true, ringConfig: { innerRadius: 1.8, outerRadius: 3.0, color: 0xc9b896, opacity: 0.8 }, textureGenerator: createSaturnTexture },
        { name: 'uranus', radius: 0.9, distance: 22, color: '#4fd0e7', speed: -0.0004, axialTilt: 97.77, rotationSpeed: 0.008, textureGenerator: createUranusTexture },
        { name: 'neptune', radius: 0.85, distance: 26, color: '#2244ff', speed: -0.0001, axialTilt: 28.32, rotationSpeed: 0.008, textureGenerator: createNeptuneTexture }
    ],
    starCount: 10000,
    cameraPosition: { x: 0, y: 30, z: 50 },
    minDistance: 10,
    maxDistance: 200,
    onInit(scene) {
        const asteroidCount = 5000;
        const innerRadius = 10.5;
        const outerRadius = 13.5;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const color1 = new THREE.Color(0xaaaaaa);
        const color2 = new THREE.Color(0x887755);
        const color3 = new THREE.Color(0x666666);
        for (let i = 0; i < asteroidCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
            positions.push(Math.cos(angle) * radius, (Math.random() - 0.5) * 0.8, Math.sin(angle) * radius);
            const rand = Math.random();
            const color = rand > 0.6 ? color1 : (rand > 0.3 ? color2 : color3);
            colors.push(color.r, color.g, color.b);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const material = new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true });
        this._asteroidBelt = new THREE.Points(geometry, material);
        scene.add(this._asteroidBelt);
    },
    onAnimate(_, speedMultiplier) {
        if (this._asteroidBelt) this._asteroidBelt.rotation.y += 0.0003 * speedMultiplier;
    }
};

// ==================== 行星特写配置 ====================

const planetConfigs = {
    mercury: {
        centerBody: { radius: 0.95, textureGenerator: createMercuryTexture, axialTilt: 0.034 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    venus: {
        centerBody: { radius: 0.95, textureGenerator: createVenusTexture, axialTilt: 177.4 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000,
        // 外层云罩（半透明，自转比表面快）
        onInit(scene) {
            const cloudGeo = new THREE.SphereGeometry(0.98, 64, 64);
            const cloudMat = new THREE.MeshPhongMaterial({
                map: createVenusCloudTexture(),
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            });
            this._venusCloud = new THREE.Mesh(cloudGeo, cloudMat);
            this.centerGroup.add(this._venusCloud);
        },
        // 金星逆向自转，速度与水星一致（基类+0.001 经 180°翻转后视效已为逆向）
        onAnimate() {
            if (this._venusCloud) this._venusCloud.rotation.y += 0.004;  // 云罩同向旋转
        }
    },
    earth: {
        centerBody: { radius: 1.0, textureGenerator: createEarthTexture, axialTilt: 23.44 },
        cameraPosition: { x: 0, y: 3, z: 7 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000,
        // 云层（作为 earth mesh 的子对象，跟随自转）+ 月球 + 天宫空间站
        onInit(scene) {
            // 云层
            const cloudGeo = new THREE.SphereGeometry(1.02, 64, 64);
            const cloudMat = new THREE.MeshPhongMaterial({
                map: createEarthCloudTexture(),
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide
            });
            const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
            this.centerMesh.add(cloudMesh);  // 子对象，跟随倾角+自转

            // 天宫空间站（程序化模型 + 轨道线）
            const tiangong = createTiangongStation();
            const tgTiltGroup = new THREE.Group();
            tgTiltGroup.add(tiangong);
            this.scene.add(tgTiltGroup);
            // 创建轨道线
            this._createOrbitLine(1.6);
            this.orbitingBodies.push({
                name: 'tiangong',
                tiltGroup: tgTiltGroup,
                mesh: tiangong,
                distance: 1.6,
                speed: -0.025,     // 稍远一点轨道，速度降低
                angle: 0,
                rotationSpeed: 0.002
            });
            this._tiangong = tiangong;
        },
        orbitingBodies: [
            { name: 'moon', radius: 0.18, distance: 3.5, color: '#888888', speed: -0.003, rotationSpeed: 0.001, textureGenerator: createMoonTexture }
        ]
    },
    mars: {
        centerBody: { radius: 0.95, textureGenerator: createMarsTexture, axialTilt: 25.19 },
        cameraPosition: { x: 0, y: 3, z: 7 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000,
        // 稀薄大气层（子对象）
        onInit(scene) {
            const atmoGeo = new THREE.SphereGeometry(0.98, 64, 64);
            const atmoMat = new THREE.MeshPhongMaterial({
                map: createMarsAtmosphereTexture(),
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
            this.centerMesh.add(atmoMesh);
        },
        orbitingBodies: [
            { name: 'phobos', radius: 0.08, distance: 2.2, color: '#8b7355', speed: -0.008, rotationSpeed: 0.002, textureGenerator: createPhobosTexture, shapeScale: { x: 1.3, y: 1.0, z: 0.9 } },
            { name: 'deimos', radius: 0.05, distance: 3.0, color: '#a0826d', speed: -0.004, rotationSpeed: 0.001, textureGenerator: createDeimosTexture, shapeScale: { x: 1.2, y: 1.0, z: 0.95 } }
        ]
    },
    jupiter: {
        centerBody: { radius: 1.0, textureGenerator: createJupiterTexture, axialTilt: 3.13 },
        cameraPosition: { x: 0, y: 3, z: 8 },
        minDistance: 3, maxDistance: 20,
        starCount: 5000,
        onInit(scene) {
            // 云层（独立对象，非子对象）
            const cloudGeo = new THREE.SphereGeometry(1.02, 64, 64);
            const cloudMat = new THREE.MeshPhongMaterial({
                map: createJupiterCloudTexture(),
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide
            });
            const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
            this.centerGroup.add(cloudMesh);  // 挂在倾角容器上，跟着行星转
        },
        orbitingBodies: [
            { name: 'io', radius: 0.12, distance: 1.8, color: '#ffffcc', speed: -0.006, rotationSpeed: 0.003, textureGenerator: createIoTexture },
            { name: 'europa', radius: 0.11, distance: 2.4, color: '#ccddff', speed: -0.0045, rotationSpeed: 0.002, textureGenerator: createEuropaTexture },
            { name: 'ganymede', radius: 0.15, distance: 3.0, color: '#aaaaaa', speed: -0.003, rotationSpeed: 0.002, textureGenerator: createGanymedeTexture },
            { name: 'callisto', radius: 0.14, distance: 3.6, color: '#886644', speed: -0.002, rotationSpeed: 0.001, textureGenerator: createCallistoTexture }
        ]
    },
    saturn: {
        centerBody: { radius: 2.5, textureGenerator: createSaturnTexture, axialTilt: 26.73 },
        cameraPosition: { x: 0, y: 15, z: 35 },
        minDistance: 10, maxDistance: 80,
        starCount: 5000,
        // 粒子环（7层环带 + 卡西尼缝 + 恩克缝）
        // 土星用 Z 轴倾角（基类默认 X 轴，此处覆盖为旧代码效果）
        onInit(scene) {
            this.centerGroup.rotation.set(0, 0, THREE.MathUtils.degToRad(26.73));
            this._saturnRing = createSaturnRing();
            this.centerGroup.add(this._saturnRing);
        },
        // 土星自转偏快（基类+0.001，此处+0.003 → 净+0.004，与旧代码一致）
        onAnimate() {
            if (this.centerMesh) this.centerMesh.rotation.y += 0.003;
            if (this._saturnRing) this._saturnRing.rotation.y += 0.004;
        },
        orbitingBodies: [
            { name: 'mimas', radius: 0.24, distance: 8.0, color: '#c0c0c0', speed: -0.005, rotationSpeed: 0.002, textureGenerator: createMimasTexture, shapeScale: { x: 1.1, y: 1.0, z: 0.95 } },
            { name: 'enceladus', radius: 0.26, distance: 9.0, color: '#d0d0d0', speed: -0.004, rotationSpeed: 0.002, textureGenerator: createEnceladusTexture },
            { name: 'tethys', radius: 0.30, distance: 10.2, color: '#c8c8c8', speed: -0.0035, rotationSpeed: 0.002, textureGenerator: () => createSaturnIceMoonTexture('light') },
            { name: 'dione', radius: 0.32, distance: 11.5, color: '#b8b8b8', speed: -0.003, rotationSpeed: 0.002, textureGenerator: () => createSaturnIceMoonTexture('medium') },
            { name: 'rhea', radius: 0.36, distance: 13.5, color: '#b0b0b0', speed: -0.0025, rotationSpeed: 0.002, textureGenerator: () => createSaturnIceMoonTexture('dark') },
            { name: 'titan', radius: 0.60, distance: 18.0, color: '#d4b88c', speed: -0.002, rotationSpeed: 0.001, textureGenerator: createTitanTexture },
            { name: 'iapetus', radius: 0.34, distance: 28.0, color: '#a8a8a8', speed: -0.0015, rotationSpeed: 0.001, textureGenerator: () => createSaturnIceMoonTexture('twoface') }
        ]
    },
    uranus: {
        centerBody: { radius: 1.0, textureGenerator: createUranusTexture, axialTilt: 97.77 },
        cameraPosition: { x: 0, y: 5, z: 10 },
        minDistance: 3, maxDistance: 25,
        starCount: 5000,
        // 大气层（子对象，跟随倾角+自转）
        onInit(scene) {
            const atmoGeo = new THREE.SphereGeometry(1.03, 64, 64);
            const atmoMat = new THREE.MeshPhongMaterial({
                map: createUranusAtmosphereTexture(),
                transparent: true,
                opacity: 0.35,
                side: THREE.DoubleSide
            });
            this.centerMesh.add(new THREE.Mesh(atmoGeo, atmoMat));
        },
        orbitingBodies: [
            { name: 'miranda', radius: 0.10, distance: 2.2, color: '#b8c4d6', speed: -0.004, rotationSpeed: 0.002, textureGenerator: () => createUranusIceMoonTexture('miranda') },
            { name: 'ariel', radius: 0.12, distance: 2.8, color: '#c8d0d8', speed: -0.003, rotationSpeed: 0.002, textureGenerator: () => createUranusIceMoonTexture('ariel') },
            { name: 'umbriel', radius: 0.11, distance: 3.4, color: '#98a0a8', speed: -0.0025, rotationSpeed: 0.002, textureGenerator: () => createUranusIceMoonTexture('umbriel') },
            { name: 'titania', radius: 0.15, distance: 4.2, color: '#b0b8c0', speed: -0.002, rotationSpeed: 0.002, textureGenerator: () => createUranusIceMoonTexture('titania') },
            { name: 'oberon', radius: 0.14, distance: 5.0, color: '#a8b0b8', speed: -0.0015, rotationSpeed: 0.002, textureGenerator: () => createUranusIceMoonTexture('oberon') }
        ]
    },
    neptune: {
        centerBody: { radius: 0.95, textureGenerator: createNeptuneTexture, axialTilt: 28.32 },
        cameraPosition: { x: 0, y: 3, z: 9 },
        minDistance: 3, maxDistance: 20,
        starCount: 5000,
        // 大气层（挂在倾角容器上）
        onInit(scene) {
            const atmoGeo = new THREE.SphereGeometry(1.00, 64, 64);
            const atmoMat = new THREE.MeshPhongMaterial({
                map: createNeptuneAtmosphereTexture(),
                transparent: true,
                opacity: 0.35,
                side: THREE.DoubleSide
            });
            this.centerGroup.add(new THREE.Mesh(atmoGeo, atmoMat));
        },
        // 海卫一逆行轨道（顺时针），自转偏快
        orbitingBodies: [
            { name: 'triton', radius: 0.18, distance: 3.5, color: '#c8b8a8', speed: -0.006, rotationSpeed: 0.002, textureGenerator: createTritonTexture }
        ]
    },
    // ==================== 卫星特写 ====================
    moon: {
        centerBody: { radius: 0.95, textureGenerator: createMoonTexture, axialTilt: 1.54 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    io: {
        centerBody: { radius: 0.95, textureGenerator: createIoTexture, axialTilt: 0 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    europa: {
        centerBody: { radius: 0.95, textureGenerator: createEuropaTexture, axialTilt: 0 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    ganymede: {
        centerBody: { radius: 0.95, textureGenerator: createGanymedeTexture, axialTilt: 0 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    callisto: {
        centerBody: { radius: 0.95, textureGenerator: createCallistoTexture, axialTilt: 0 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    mimas: {
        centerBody: { radius: 0.95, textureGenerator: createMimasTexture, axialTilt: 0, shapeScale: { x: 1.1, y: 1.0, z: 0.95 } },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    enceladus: {
        centerBody: { radius: 0.95, textureGenerator: createEnceladusTexture, axialTilt: 0 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    tethys: {
        centerBody: { radius: 0.95, textureGenerator: () => createSaturnIceMoonTexture('light'), axialTilt: 0 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    dione: {
        centerBody: { radius: 0.95, textureGenerator: () => createSaturnIceMoonTexture('medium'), axialTilt: 0 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    rhea: {
        centerBody: { radius: 0.95, textureGenerator: () => createSaturnIceMoonTexture('dark'), axialTilt: 0 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    iapetus: {
        centerBody: { radius: 0.95, textureGenerator: () => createSaturnIceMoonTexture('twoface'), axialTilt: 0 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    titan: {
        centerBody: { radius: 0.95, textureGenerator: createTitanTexture, axialTilt: 0 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    miranda: {
        centerBody: { radius: 0.95, textureGenerator: () => createUranusIceMoonTexture('miranda'), axialTilt: 0 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    ariel: {
        centerBody: { radius: 0.95, textureGenerator: () => createUranusIceMoonTexture('ariel'), axialTilt: 0 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    umbriel: {
        centerBody: { radius: 0.95, textureGenerator: () => createUranusIceMoonTexture('umbriel'), axialTilt: 0 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    titania: {
        centerBody: { radius: 0.95, textureGenerator: () => createUranusIceMoonTexture('titania'), axialTilt: 0 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    oberon: {
        centerBody: { radius: 0.95, textureGenerator: () => createUranusIceMoonTexture('oberon'), axialTilt: 0 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    triton: {
        centerBody: { radius: 0.95, textureGenerator: createTritonTexture, axialTilt: 0 },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    phobos: {
        centerBody: { radius: 0.95, textureGenerator: createPhobosTexture, axialTilt: 0, shapeScale: { x: 1.3, y: 1.0, z: 0.9 } },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    deimos: {
        centerBody: { radius: 0.95, textureGenerator: createDeimosTexture, axialTilt: 0, shapeScale: { x: 1.2, y: 1.0, z: 0.95 } },
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15,
        starCount: 5000
    },
    tiangong: {
        centerBody: { radius: 0.01, color: 0x000000 },
        cameraPosition: { x: 0, y: 0.1, z: 0.8 },
        minDistance: 0.2, maxDistance: 3,
        starCount: 3000,
        onInit(scene) {
            const station = createTiangongStation();
            this.centerGroup.add(station);
            this._tiangongModel = station;
        }
    }
};

// ==================== 卫星列表数据（参照老代码 planet-selector.js）====================

const PLANET_EMOJI = {
    sun: '☀️', mercury: '☿️', venus: '♀️', earth: '🌍', mars: '♂️',
    jupiter: '♃', saturn: '🪐', uranus: '♅', neptune: '♆'
};

const PLANET_NAMES = {
    sun:     { zh: '太阳', en: 'Sun' },
    mercury: { zh: '水星', en: 'Mercury' },
    venus:   { zh: '金星', en: 'Venus' },
    earth:   { zh: '地球', en: 'Earth' },
    mars:    { zh: '火星', en: 'Mars' },
    jupiter: { zh: '木星', en: 'Jupiter' },
    saturn:  { zh: '土星', en: 'Saturn' },
    uranus:  { zh: '天王星', en: 'Uranus' },
    neptune: { zh: '海王星', en: 'Neptune' }
};

const ALL_MOONS = [
    // 地球卫星
    { id: 'moon', name: { zh: '月球', en: 'Moon' }, color: '#888888', planet: 'earth', enabled: true },
    { id: 'tiangong', name: { zh: '天宫空间站', en: 'Tiangong' }, color: '#d4d4e8', planet: 'earth', enabled: true },
    // 火星卫星
    { id: 'phobos', name: { zh: '火卫一', en: 'Phobos' }, color: '#8b7355', planet: 'mars', enabled: true },
    { id: 'deimos', name: { zh: '火卫二', en: 'Deimos' }, color: '#a0826d', planet: 'mars', enabled: true },
    // 木星卫星
    { id: 'io', name: { zh: '木卫一', en: 'Io' }, color: '#ffffcc', planet: 'jupiter', enabled: true },
    { id: 'europa', name: { zh: '木卫二', en: 'Europa' }, color: '#ccddff', planet: 'jupiter', enabled: true },
    { id: 'ganymede', name: { zh: '木卫三', en: 'Ganymede' }, color: '#aaaaaa', planet: 'jupiter', enabled: true },
    { id: 'callisto', name: { zh: '木卫四', en: 'Callisto' }, color: '#886644', planet: 'jupiter', enabled: true },
    // 土星卫星
    { id: 'mimas', name: { zh: '土卫一', en: 'Mimas' }, color: '#c0c0c0', planet: 'saturn', enabled: true },
    { id: 'enceladus', name: { zh: '土卫二', en: 'Enceladus' }, color: '#d0d0d0', planet: 'saturn', enabled: true },
    { id: 'tethys', name: { zh: '土卫三', en: 'Tethys' }, color: '#c8c8c8', planet: 'saturn', enabled: true },
    { id: 'dione', name: { zh: '土卫四', en: 'Dione' }, color: '#b8b8b8', planet: 'saturn', enabled: true },
    { id: 'rhea', name: { zh: '土卫五', en: 'Rhea' }, color: '#b0b0b0', planet: 'saturn', enabled: true },
    { id: 'titan', name: { zh: '土卫六', en: 'Titan' }, color: '#d4b88c', planet: 'saturn', enabled: true },
    { id: 'iapetus', name: { zh: '土卫八', en: 'Iapetus' }, color: '#a8a8a8', planet: 'saturn', enabled: true },
    // 天王星卫星
    { id: 'miranda', name: { zh: '天卫一', en: 'Miranda' }, color: '#b8c4d6', planet: 'uranus', enabled: true },
    { id: 'ariel', name: { zh: '天卫二', en: 'Ariel' }, color: '#c8d0d8', planet: 'uranus', enabled: true },
    { id: 'umbriel', name: { zh: '天卫三', en: 'Umbriel' }, color: '#98a0a8', planet: 'uranus', enabled: true },
    { id: 'titania', name: { zh: '天卫四', en: 'Titania' }, color: '#b0b8c0', planet: 'uranus', enabled: true },
    { id: 'oberon', name: { zh: '天卫五', en: 'Oberon' }, color: '#a8b0b8', planet: 'uranus', enabled: true },
    // 海王星卫星
    { id: 'triton', name: { zh: '海卫一', en: 'Triton' }, color: '#c8b8a8', planet: 'neptune', enabled: true }
];

function darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000
        + (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100
        + (B < 255 ? (B < 1 ? 0 : B) : 255)).toString(16).slice(1);
}

function renderMoonsList() {
    const container = document.getElementById('moons-popup-content');
    const header = document.getElementById('moons-popup-header');
    if (!container) return;

    const lang = typeof LanguageManager !== 'undefined' ? LanguageManager.getLang() : 'zh';

    if (header) {
        header.textContent = lang === 'zh' ? '🌑 卫星列表' : '🌑 Moon List';
    }

    container.innerHTML = ALL_MOONS.map(m => {
        const name = lang === 'zh' ? m.name.zh : m.name.en;
        const cls = m.enabled ? 'moon-item' : 'moon-item moon-item-disabled';
        return `
            <div class="${cls}" data-moon="${m.id}" ${!m.enabled ? 'style="opacity:0.4;cursor:default"' : ''}>
                <div class="moon-sphere" style="background: radial-gradient(circle at 30% 30%, ${m.color}, ${darkenColor(m.color, 30)});"></div>
                <div class="moon-name">${name}</div>
            </div>
        `;
    }).join('');
}

function renderPlanetSelector() {
    const lang = typeof LanguageManager !== 'undefined' ? LanguageManager.getLang() : 'zh';

    // 行星标签
    document.querySelectorAll('.planet-icon[data-planet]').forEach(el => {
        const planet = el.dataset.planet;
        const nameData = PLANET_NAMES[planet];
        if (!nameData) return;
        const label = el.querySelector('.planet-name-label');
        if (label) {
            label.textContent = `${PLANET_EMOJI[planet] || ''} ${nameData[lang]}`;
        }
    });

    // 卫星列表按钮
    const moonsBtn = document.getElementById('moons-list-btn');
    if (moonsBtn) {
        const label = moonsBtn.querySelector('.planet-name-label');
        if (label) {
            label.textContent = lang === 'zh' ? '🌑 卫星列表' : '🌑 Moon List';
        }
    }
}

function planetDetailConfig(planetId) {
    const cfg = planetConfigs[planetId];
    if (!cfg) return {
        centerBody: { radius: 0.6, color: 0xffffff },
        starCount: 5000,
        cameraPosition: { x: 0, y: 2, z: 5 },
        minDistance: 2, maxDistance: 15
    };
    // 确保 orbitingBodies 默认空数组
    if (!cfg.orbitingBodies) cfg.orbitingBodies = [];
    return cfg;
}

// ==================== 主题切换 ====================

function applyTheme(color) {
    document.documentElement.style.setProperty('--theme-color', color);
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    document.documentElement.style.setProperty('--theme-color-rgb', `${r}, ${g}, ${b}`);
}

// ==================== 场景切换 ====================

function switchScene(mode) {
    if (currentMode === mode) return;
    currentMode = mode;

    // 清理旧场景
    if (currentSystem) {
        currentSystem.clear();
        currentSystem = null;
    }

    // 根据模式选择配置
    const config = mode === 'sun' ? solarSystemConfig : planetDetailConfig(mode);

    currentSystem = new CelestialSystem(config);
    currentSystem.init('scene-container');
}

// ==================== 启动 ====================

function init() {
    // 默认：太阳系全景
    switchScene('sun');

    // InfoPanel 加载太阳系数据
    InfoPanel.init('info-panel');
    InfoPanel.load('solar_system');

    // QuizPanel 加载太阳系题库
    QuizPanel.init('quiz-panel');
    QuizPanel.load('solar_system');

    // 天体选择器点击事件
    document.getElementById('planet-selector').addEventListener('click', (e) => {
        const icon = e.target.closest('.planet-icon');
        if (!icon) return;

        // 卫星列表按钮：不处理，CSS hover 自动弹出
        if (icon.id === 'moons-list-btn') return;

        const planet = icon.dataset.planet;
        const color = icon.dataset.color;

        // 更新激活状态
        document.querySelectorAll('.planet-icon').forEach(el => el.classList.remove('active'));
        icon.classList.add('active');

        // 切换主题色
        if (color) applyTheme(color);

        // 加载对应数据
        const dataId = planet === 'sun' ? 'solar_system' : planet;
        InfoPanel.load(dataId);
        QuizPanel.load(dataId);

        // 切换 3D 场景
        switchScene(planet === 'sun' ? 'sun' : planet);
    });

    // ==================== 卫星列表 ====================

    // 生成卫星列表
    renderMoonsList();

    // 初始化行星选择器标签
    renderPlanetSelector();

    // 点击卫星列表项
    document.getElementById('moons-popup').addEventListener('click', (e) => {
        const item = e.target.closest('.moon-item');
        if (!item) return;

        const moonId = item.dataset.moon;
        const moon = ALL_MOONS.find(m => m.id === moonId);

        // 只有已启用的卫星才能跳转
        if (!moon || !moon.enabled) return;

        // 更新天体激活状态（取消所有行星高亮）
        document.querySelectorAll('.planet-icon').forEach(el => el.classList.remove('active'));
        document.getElementById('moons-list-btn').classList.add('active');

        // 切换主题色
        applyTheme(moon.color);

        // 加载卫星数据
        InfoPanel.load(moonId);
        QuizPanel.load(moonId);

        // 切换到卫星特写
        switchScene(moonId);
    });

    // 语言切换时重新渲染卫星列表
    document.addEventListener('languageChanged', () => {
        renderMoonsList();
        renderPlanetSelector();
    });
}

init();
