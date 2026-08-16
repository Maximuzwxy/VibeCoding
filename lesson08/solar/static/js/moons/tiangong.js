/**
 * 中国天宫空间站 - 程序化3D模型
 *
 * 参考真实结构：
 *   天和核心舱（中心，水平，T形交点）
 *   问天实验舱 + 梦天实验舱（垂直分支，两侧）
 *   大型柔性太阳翼（每个实验舱 2 组）
 *   节点舱 + 神舟载人飞船（前端对接口）
 *   天舟货运飞船（后端对接口）
 */

import * as THREE from 'three';

export function createTiangongStation() {
    const group = new THREE.Group();

    // ===== 材质 =====
    const whiteMat = new THREE.MeshPhongMaterial({
        color: 0xf5f5f5,
        specular: 0x555555,
        shininess: 35
    });
    const offWhiteMat = new THREE.MeshPhongMaterial({
        color: 0xe8e8e8,
        specular: 0x444444,
        shininess: 30
    });
    const grayMat = new THREE.MeshPhongMaterial({
        color: 0xbbbbbb,
        specular: 0x333333,
        shininess: 25
    });
    const darkMat = new THREE.MeshPhongMaterial({
        color: 0x666666,
        specular: 0x111111,
        shininess: 15
    });
    const solarGoldMat = new THREE.MeshPhongMaterial({
        color: 0xb8960c,
        specular: 0x332200,
        shininess: 20,
        side: THREE.DoubleSide
    });
    const solarBlueMat = new THREE.MeshPhongMaterial({
        color: 0x1a3a6e,
        specular: 0x112244,
        shininess: 40,
        side: THREE.DoubleSide
    });
    const goldMat = new THREE.MeshPhongMaterial({
        color: 0xd4a843,
        specular: 0x664411,
        shininess: 55
    });

    // ===== 天和核心舱（中心圆柱，沿 X 轴水平） =====
    // 总长 16.6m，分为节点舱段 + 生活控制舱段 + 资源舱段
    // 生活控制舱有小柱段(细) + 大柱段(粗)
    const coreGroup = new THREE.Group();

    // 资源舱（后端，拉长2倍，确保正X方向视觉延伸）
    const resourceGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.44, 16);
    const resource = new THREE.Mesh(resourceGeo, offWhiteMat);
    resource.rotation.z = Math.PI / 2;
    resource.position.x = 0.47;
    coreGroup.add(resource);

    // 大柱段（生活控制舱主体，粗）
    const bigColumnGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.30, 20);
    const bigColumn = new THREE.Mesh(bigColumnGeo, whiteMat);
    bigColumn.rotation.z = Math.PI / 2;
    bigColumn.position.x = 0.10;
    coreGroup.add(bigColumn);

    // 小柱段（过渡段，锥形）
    const smallColumnGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.14, 16);
    const smallColumn = new THREE.Mesh(smallColumnGeo, offWhiteMat);
    smallColumn.rotation.z = Math.PI / 2;
    smallColumn.position.x = -0.12;
    coreGroup.add(smallColumn);

    // 节点舱（前端球形，有多个对接口）
    const nodeGeo = new THREE.SphereGeometry(0.10, 16, 16);
    const node = new THREE.Mesh(nodeGeo, grayMat);
    node.position.x = -0.28;
    coreGroup.add(node);

    // 节点舱对接口环
    const dockRingGeo = new THREE.TorusGeometry(0.05, 0.012, 8, 16);
    const dockRingFront = new THREE.Mesh(dockRingGeo, darkMat);
    dockRingFront.position.set(-0.38, 0, 0);
    dockRingFront.rotation.y = Math.PI / 2;
    coreGroup.add(dockRingFront);

    const dockRingRadial = new THREE.Mesh(dockRingGeo, darkMat);
    dockRingRadial.position.set(-0.28, 0.10, 0);
    dockRingRadial.rotation.x = Math.PI / 2;
    coreGroup.add(dockRingRadial);

    group.add(coreGroup);

    // ===== 中国国旗（按国旗法官方制法，左上象限15列×10行网格） =====
    const flagCanvas = document.createElement('canvas');
    flagCanvas.width = 150;
    flagCanvas.height = 100;
    const ctxFlag = flagCanvas.getContext('2d');
    // 红色旗面（3:2）
    ctxFlag.fillStyle = '#DE2910';
    ctxFlag.fillRect(0, 0, 150, 100);
    ctxFlag.fillStyle = '#FFDE00';

    function drawStar(cx, cy, outerR, innerR, rot) {
        ctxFlag.beginPath();
        for (let i = 0; i < 10; i++) {
            const a = -Math.PI / 2 + rot + (i * Math.PI) / 5;
            const r = (i % 2 === 0) ? outerR : innerR;
            if (i === 0) ctxFlag.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            else ctxFlag.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        }
        ctxFlag.closePath();
        ctxFlag.fill();
    }

    // 大星：上五下五、左五右十 → 格(5,5) → px(25,25)，外径3格=15px
    const bx = 25, by = 25;
    drawStar(bx, by, 15, 6, 0);
    // 4 小星：各1格外径=5px，尖角朝向大星中心
    const starPos = [
        [50, 10],   // 上二下八、左十右五
        [60, 20],   // 上四下六、左十二右三
        [60, 35],   // 上七下三、左十二右三
        [50, 45]    // 上九下一、左十右五
    ];
    starPos.forEach(([sx, sy]) => {
        const ang = Math.atan2(by - sy, bx - sx) + Math.PI / 2;
        drawStar(sx, sy, 5, 2, ang);
    });

    const flagTex = new THREE.CanvasTexture(flagCanvas);
    flagTex.colorSpace = THREE.SRGBColorSpace;
    const flagMat = new THREE.MeshBasicMaterial({
        map: flagTex,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const flagGeo = new THREE.PlaneGeometry(0.26, 0.173);
    const flagMesh = new THREE.Mesh(flagGeo, flagMat);
    // 大柱段中心x=0.10，往左偏移到x=0.04靠近T形交点
    flagMesh.position.set(0, 0, 0.125);
    flagMesh.renderOrder = 1;
    coreGroup.add(flagMesh);

    // ===== 神舟载人飞船（前端对接口） =====
    const shenzhouGroup = new THREE.Group();
    // 轨道舱（球锥）
    const orbitalGeo = new THREE.SphereGeometry(0.06, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const orbital = new THREE.Mesh(orbitalGeo, whiteMat);
    orbital.rotation.z = Math.PI;
    shenzhouGroup.add(orbital);
    // 返回舱（钟形）
    const reentryGeo = new THREE.ConeGeometry(0.07, 0.10, 12);
    const reentry = new THREE.Mesh(reentryGeo, offWhiteMat);
    reentry.position.x = -0.05;
    reentry.rotation.z = Math.PI / 2;
    shenzhouGroup.add(reentry);
    // 推进舱（圆柱）
    const serviceGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.15, 12);
    const service = new THREE.Mesh(serviceGeo, grayMat);
    service.position.x = -0.15;
    service.rotation.z = Math.PI / 2;
    shenzhouGroup.add(service);

    shenzhouGroup.position.set(-0.48, 0, 0);
    group.add(shenzhouGroup);

    // ===== 天舟货运飞船（后端） =====
    const tianzhouGroup = new THREE.Group();
    const cargoGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.25, 12);
    const cargo = new THREE.Mesh(cargoGeo, offWhiteMat);
    cargo.rotation.z = Math.PI / 2;
    tianzhouGroup.add(cargo);
    // 货舱对接环
    const cargoRingGeo = new THREE.TorusGeometry(0.09, 0.01, 8, 12);
    const cargoRing = new THREE.Mesh(cargoRingGeo, darkMat);
    cargoRing.position.x = 0.12;
    cargoRing.rotation.y = Math.PI / 2;
    tianzhouGroup.add(cargoRing);

    tianzhouGroup.position.set(0.82, 0, 0);
    group.add(tianzhouGroup);

    // ===== 问天实验舱（上分支，沿 Y 轴） =====
    const labGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.70, 16);
    const wentian = new THREE.Mesh(labGeo, whiteMat);
    wentian.position.y = 0.35;

    // 问天气闸舱（侧面凸起）
    const airlockGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.10, 12);
    const airlock = new THREE.Mesh(airlockGeo, grayMat);
    airlock.position.set(0, 0.28, 0.11);
    airlock.rotation.x = Math.PI / 2;
    wentian.add(airlock);

    group.add(wentian);

    // ===== 梦天实验舱（下分支，沿 -Y 轴） =====
    const mengtian = new THREE.Mesh(labGeo, whiteMat);
    mengtian.position.y = -0.35;

    // 梦天货物气闸舱
    const cargoAirlockGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12);
    const cargoAirlock = new THREE.Mesh(cargoAirlockGeo, grayMat);
    cargoAirlock.position.set(0, -0.28, -0.11);
    cargoAirlock.rotation.x = Math.PI / 2;
    mengtian.add(cargoAirlock);

    group.add(mengtian);

    // ===== 大型柔性太阳翼 =====
    // 基于真实数据：问天/梦天单翼 27m 翼展、138 ㎡，约为舱体(17.88m)的 1.5 倍
    // 天和单翼 12.6m 翼展、67 ㎡，约为舱体(16.6m)的 0.76 倍
    // 所有面板在 XY 平面展开（实验舱沿 X 展开，核心舱沿 Y 展开）

    function createWingSegment(offset, size1, size2, axis) {
        const segGroup = new THREE.Group();
        // 金色背板
        const gold = new THREE.Mesh(new THREE.BoxGeometry(size1, size2, 0.004), solarGoldMat);
        segGroup.add(gold);
        // 蓝色电池面
        const blue = new THREE.Mesh(new THREE.BoxGeometry(size1 * 0.97, size2 * 0.97, 0.005), solarBlueMat);
        segGroup.add(blue);
        // 边框线
        const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(size1, size2, 0.005));
        const edge = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0x886600 }));
        segGroup.add(edge);
        if (axis === 'x') segGroup.position.x = offset;
        else segGroup.position.y = offset;
        return segGroup;
    }

    // 实验舱太阳翼（沿 ±X 方向展开，面板在 XY 平面）
    function createLargeSolarWing(sideX, baseY) {
        var wingGroup = new THREE.Group();

        // 桁架连接杆（沿 X 方向延伸）
        var trussLen = 0.45;
        var trussGeo = new THREE.CylinderGeometry(0.015, 0.015, trussLen, 8);
        var truss = new THREE.Mesh(trussGeo, new THREE.MeshPhongMaterial({
            color: 0xc0a030, specular: 0x664411, shininess: 45
        }));
        truss.rotation.z = Math.PI / 2;
        truss.position.x = sideX * trussLen / 2;
        wingGroup.add(truss);

        var segW = 0.18;   // 面板宽度（沿 Y）
        var segL = 0.14;   // 面板长度（沿 X）
        var segGap = 0.01;
        var startX = sideX * (trussLen * 0.3);
        var stepX = sideX * (segL + segGap);

        for (var s = 0; s < 3; s++) {
            var seg = createWingSegment(startX + s * stepX, segL, segW, 'x');
            wingGroup.add(seg);
        }

        wingGroup.position.y = baseY;
        return wingGroup;
    }

    // 问天实验舱双翼（±X 方向，XY 平面，资源舱末端 y≈0.55）
    group.add(createLargeSolarWing(1, 0.55));
    group.add(createLargeSolarWing(-1, 0.55));

    // 梦天实验舱双翼（±X 方向，XY 平面，资源舱末端 y≈-0.55）
    group.add(createLargeSolarWing(1, -0.55));
    group.add(createLargeSolarWing(-1, -0.55));

    // ===== 天和核心舱太阳翼（小型，大柱段侧面，±Y 方向，XY 平面） =====
    function createCoreWing(sideY) {
        var wingGroup = new THREE.Group();
        // 短桁架（沿 Y 方向）
        var trussGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.28, 8);
        var truss = new THREE.Mesh(trussGeo, new THREE.MeshPhongMaterial({
            color: 0xc0a030, specular: 0x664411, shininess: 45
        }));
        truss.position.y = sideY * 0.14;
        wingGroup.add(truss);

        var segW = 0.10;  // 面板宽度（沿 X）
        var segL = 0.13;  // 面板长度（沿 Y）
        for (var s = 0; s < 2; s++) {
            var seg = createWingSegment(sideY * (0.06 + s * (segL + 0.01)), segL, segW, 'y');
            wingGroup.add(seg);
        }

        wingGroup.position.set(0.15, 0, 0);
        return wingGroup;
    }

    group.add(createCoreWing(1));
    group.add(createCoreWing(-1));

    // ===== 导航信标灯 =====
    const beaconGeo = new THREE.SphereGeometry(0.012, 6, 6);
    const redBeacon = new THREE.Mesh(beaconGeo, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    redBeacon.position.set(-0.48, 0.12, 0);
    group.add(redBeacon);

    const greenBeacon = new THREE.Mesh(beaconGeo, new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    greenBeacon.position.set(0.75, -0.12, 0);
    group.add(greenBeacon);

    // ===== 缩放 =====
    // 目标：整体长度 ≈ 0.22（月球直径 0.36 的约 60%）
    // 当前全长 ≈ 1.4（神舟到头 → 天舟尾），需缩放到 0.22
    group.scale.set(0.16, 0.16, 0.16);

    return group;
}
