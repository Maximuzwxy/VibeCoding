/**
 * CelestialSystem - 通用天体系统基类
 * 
 * 支持：
 * - 中心天体（球体 + 可选光晕 + 轴倾角）
 * - 环绕天体（行星/卫星，自转 + 公转 + 轴倾角 + 可选环/纹理）
 * - 轨道线
 * - 星空背景
 * - OrbitControls 相机控制
 * - 生命周期管理（init / clear / resize）
 * 
 * 配置格式见 SPEC.md
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class CelestialSystem {
    /**
     * @param {Object} config - 系统配置
     * @param {Object} config.centerBody - 中心天体配置
     * @param {Array}  config.orbitingBodies - 环绕天体配置数组
     * @param {number} config.starCount - 星空星星数量（默认 10000）
     * @param {Object} config.cameraPosition - 相机初始位置 {x, y, z}
     * @param {number} config.minDistance - OrbitControls 最小距离
     * @param {number} config.maxDistance - OrbitControls 最大距离
     * @param {Function} [config.onInit] - 初始化后钩子
     * @param {Function} [config.onAnimate] - 每帧动画钩子
     */
    constructor(config = {}) {
        this.config = config;

        // Three.js 对象
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.container = null;

        // 场景元素
        this.centerGroup = null;   // 中心天体的倾角容器
        this.centerMesh = null;
        this.orbitingBodies = [];  // { name, tiltGroup, mesh, distance, speed, angle, rotationSpeed, hasRings }
        this.orbitLines = [];
        this.starfield = null;

        // 动画
        this.animationFrameId = null;
        this.speedMultiplier = 1;

        // 回调
        this._onAnimate = config.onAnimate || null;

        // 绑定方法
        this._animate = this._animate.bind(this);
        this._onResize = this._onResize.bind(this);
    }

    // ==================== 初始化 ====================

    /**
     * 初始化 3D 场景
     * @param {string} containerId - 容器 DOM ID
     */
    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`CelestialSystem: container #${containerId} not found`);
            return;
        }
        this.container = container;
        container.innerHTML = '';

        this._initScene();
        this._initCamera();
        this._initRenderer(container);
        this._initControls();
        this._initLights();
        this._createStarfield();
        this._createCenterBody();
        this._createOrbitingBodies();

        // 钩子：子类可在此添加额外元素（如小行星带）
        if (this.config.onInit) {
            this.config.onInit.call(this, this.scene);
        }

        window.addEventListener('resize', this._onResize);
        this._animate();
    }

    _initScene() {
        this.scene = new THREE.Scene();
    }

    _initCamera() {
        const cp = this.config.cameraPosition || { x: 0, y: 30, z: 50 };
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(cp.x, cp.y, cp.z);
    }

    _initRenderer(container) {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);
    }

    _initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = this.config.minDistance || 10;
        this.controls.maxDistance = this.config.maxDistance || 200;
        this.controls.target.set(0, 0, 0);
    }

    _initLights() {
        // 暗灰环境光，保留暗部细节但不冲淡明暗对比
        const ambientLight = new THREE.AmbientLight(0x333333);
        this.scene.add(ambientLight);

        // 方向光（模拟远处太阳的平行光），从侧上方打，产生明暗面+高光
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sunLight.position.set(5, 3, 5);
        this.scene.add(sunLight);
    }

    // ==================== 星空背景 ====================

    _createStarfield() {
        const count = this.config.starCount || 10000;
        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 400;
            const y = (Math.random() - 0.5) * 400;
            const z = (Math.random() - 0.5) * 400;
            vertices.push(x, y, z);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        // 圆形纹理
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

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.35,
            sizeAttenuation: true,
            map: texture,
            transparent: true,
            alphaTest: 0.5
        });

        this.starfield = new THREE.Points(geometry, material);
        this.scene.add(this.starfield);
    }

    // ==================== 形状变形 ====================

    _applyShapeScale(geometry, shapeScale) {
        const pos = geometry.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
            pos[i]     *= shapeScale.x || 1;
            pos[i + 1] *= shapeScale.y || 1;
            pos[i + 2] *= shapeScale.z || 1;
        }
        geometry.computeVertexNormals();
    }

    // ==================== 中心天体 ====================

    _createCenterBody() {
        const cb = this.config.centerBody;
        if (!cb) return;

        const { radius = 2, color = 0xffffff, texturePath, textureRepeat = 1,
                axialTilt = 0, glowColor, glowOpacity = 0.3, glowSize,
                textureGenerator, shapeScale } = cb;

        // 倾角容器
        this.centerGroup = new THREE.Group();
        this.centerGroup.rotation.x = THREE.MathUtils.degToRad(axialTilt);
        this.scene.add(this.centerGroup);

        // 球体
        const geometry = new THREE.SphereGeometry(radius, 64, 64);
        if (shapeScale) {
            this._applyShapeScale(geometry, shapeScale);
        }
        let material;

        if (texturePath) {
            const texture = new THREE.TextureLoader().load(texturePath);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapU = THREE.RepeatWrapping;
            texture.repeat.set(textureRepeat, textureRepeat);
            material = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.8,
                metalness: 0.2
            });
        } else if (textureGenerator) {
            const genTexture = textureGenerator();
            genTexture.wrapS = THREE.RepeatWrapping;
            genTexture.wrapT = THREE.ClampToEdgeWrapping;
            material = new THREE.MeshPhongMaterial({
                map: genTexture,
                bumpScale: 0.05,
                specular: new THREE.Color(0x333333),
                shininess: 5
            });
        } else {
            material = new THREE.MeshBasicMaterial({ color });
        }

        this.centerMesh = new THREE.Mesh(geometry, material);
        this.centerGroup.add(this.centerMesh);

        // 光晕
        if (glowColor !== undefined) {
            const gSize = glowSize || radius * 1.25;
            const glowGeo = new THREE.SphereGeometry(gSize, 32, 32);
            const glowMat = new THREE.MeshBasicMaterial({
                color: glowColor,
                transparent: true,
                opacity: glowOpacity
            });
            this.centerMesh.add(new THREE.Mesh(glowGeo, glowMat));
        }
    }

    // ==================== 环绕天体 ====================

    _createOrbitingBodies() {
        const bodies = this.config.orbitingBodies || [];
        bodies.forEach(config => this.addOrbitingBody(config));
    }

    /**
     * 添加一个环绕天体
     * @param {Object} config
     * @param {string} config.name - 名称
     * @param {number} config.radius - 球体半径
     * @param {number} config.distance - 轨道距离
     * @param {number|string} config.color - 颜色（hex 或 CSS 字符串）
     * @param {number} config.speed - 公转速度（负=逆时针）
     * @param {number} [config.axialTilt=0] - 轴倾角（度）
     * @param {number} [config.rotationSpeed=0.01] - 自转速度（负=反转）
     * @param {boolean} [config.hasRings=false] - 是否有环
     * @param {Object} [config.ringConfig] - 环配置
     * @param {string} [config.texturePath] - 纹理路径
     */
    addOrbitingBody(config) {
        const {
            name, radius, distance, color, speed,
            axialTilt = 0,
            rotationSpeed = 0.01,
            hasRings = false,
            ringConfig = {},
            texturePath,
            textureRepeat = 1,
            textureGenerator,
            shapeScale
        } = config;

        // 解析颜色
        const colorHex = typeof color === 'string'
            ? parseInt(color.replace('#', ''), 16)
            : color;

        // 球体
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        if (shapeScale) {
            this._applyShapeScale(geometry, shapeScale);
        }
        let material;

        if (texturePath) {
            const texture = new THREE.TextureLoader().load(texturePath);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapU = THREE.RepeatWrapping;
            texture.repeat.set(textureRepeat, textureRepeat);
            material = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.8,
                metalness: 0.2
            });
        } else if (textureGenerator) {
            const genTexture = textureGenerator();
            genTexture.wrapS = THREE.RepeatWrapping;
            genTexture.wrapT = THREE.ClampToEdgeWrapping;
            material = new THREE.MeshPhongMaterial({
                map: genTexture,
                bumpScale: 0.05,
                specular: new THREE.Color(0x333333),
                shininess: 5
            });
        } else {
            material = new THREE.MeshStandardMaterial({
                color: colorHex,
                roughness: 0.8,
                metalness: 0.2
            });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { name, distance, celestialType: 'orbitingBody', config };

        // 环
        if (hasRings) {
            const rc = ringConfig;
            const innerR = rc.innerRadius || radius * 1.5;
            const outerR = rc.outerRadius || radius * 2.5;
            const ringColor = rc.color !== undefined ? rc.color : 0xc9b896;
            const ringOpacity = rc.opacity !== undefined ? rc.opacity : 0.8;

            const ringGeo = new THREE.RingGeometry(innerR, outerR, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: ringColor,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: ringOpacity
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            mesh.add(ring);
        }

        // 倾角容器
        const tiltGroup = new THREE.Group();
        tiltGroup.rotation.x = THREE.MathUtils.degToRad(axialTilt);
        tiltGroup.add(mesh);
        this.scene.add(tiltGroup);

        this.orbitingBodies.push({
            name,
            tiltGroup,
            mesh,
            distance,
            speed,
            angle: Math.random() * Math.PI * 2,
            rotationSpeed
        });

        // 轨道线（仅当 distance > 0）
        if (distance > 0) {
            this._createOrbitLine(distance);
        }
    }

    // ==================== 轨道线 ====================

    _createOrbitLine(distance) {
        const points = [];
        const segments = 128;
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
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
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        this.orbitLines.push(line);
    }

    // ==================== 动画 ====================

    _animate() {
        this.animationFrameId = requestAnimationFrame(this._animate);

        // 中心天体自转
        if (this.centerMesh) {
            this.centerMesh.rotation.y += 0.001 * this.speedMultiplier;
        }

        // 环绕天体 公转 + 自转
        this.orbitingBodies.forEach(body => {
            body.angle += body.speed * this.speedMultiplier;
            body.tiltGroup.position.x = Math.cos(body.angle) * body.distance;
            body.tiltGroup.position.z = Math.sin(body.angle) * body.distance;
            body.mesh.rotation.y += body.rotationSpeed * this.speedMultiplier;
        });

        // 钩子：子类额外动画（如小行星带旋转）
        if (this._onAnimate) {
            this._onAnimate.call(this, this.scene, this.speedMultiplier);
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    // ==================== 速度控制 ====================

    setSpeed(multiplier) {
        this.speedMultiplier = Math.max(0, multiplier);
    }

    getSpeed() {
        return this.speedMultiplier;
    }

    // ==================== 行星聚焦 ====================

    /**
     * 聚焦到指定天体
     * @param {string} name - 天体名称
     */
    focusOn(name) {
        if (name === 'sun' || name === 'center') {
            this.controls.target.set(0, 0, 0);
            return;
        }

        const body = this.orbitingBodies.find(b => b.name === name);
        if (body) {
            const pos = body.tiltGroup.position;
            this.controls.target.copy(pos);
        }
    }

    // ==================== 生命周期 ====================

    resize() {
        this._onResize();
    }

    _onResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * 清除场景，释放资源
     */
    clear() {
        // 取消动画
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // 移除事件
        window.removeEventListener('resize', this._onResize);

        // 清空环绕天体列表
        this.orbitingBodies = [];
        this.orbitLines = [];

        // 释放 Three.js 资源
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(m => {
                            if (m.map) m.map.dispose();
                            m.dispose();
                        });
                    } else {
                        if (object.material.map) object.material.map.dispose();
                        object.material.dispose();
                    }
                }
            });
            this.scene.clear();
        }

        // 清理渲染器
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.forceContextLoss();
            if (this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        // 清理容器
        if (this.container) {
            this.container.innerHTML = '';
        }

        // 清空引用
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.centerGroup = null;
        this.centerMesh = null;
        this.starfield = null;
    }
}
