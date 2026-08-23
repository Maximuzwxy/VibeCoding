class SkeletonFactory {
    static create(scene, position = new THREE.Vector3(0, 0, 0)) {
        const skeleton = {
            gunGroup: null,
            leftUpperArm: null,
            leftForearm: null,
            rightUpperArm: null,
            rightForearm: null,
            shoulders: null,
            leftThigh: null,
            leftShin: null,
            rightThigh: null,
            rightShin: null,
            root: null,
            leftShoulderPos: null,
            rightShoulderPos: null
        };

        const root = new THREE.Object3D();
        root.position.copy(position);
        scene.add(root);
        skeleton.root = root;

        const colors = {
            pelvis: 0x333333,
            spine: 0x333333,
            head: 0xFFDBB4,
            leftArm: 0xFFDBB4,
            rightArm: 0xFFDBB4,
            leftLeg: 0x2F4F2F,
            rightLeg: 0x2F4F2F
        };

        const halfPelvis = SKELETON_CONFIG.pelvisLength / 2;
        const halfShoulder = SKELETON_CONFIG.shoulderWidth;

        const leftHipPos = new THREE.Vector3(halfPelvis, 0, 0);
        const rightHipPos = new THREE.Vector3(-halfPelvis, 0, 0);
        const leftShoulderPos = new THREE.Vector3(halfShoulder, 0, 0);
        const rightShoulderPos = new THREE.Vector3(-halfShoulder, 0, 0);

        const pelvis = new THREE.Object3D();
        pelvis.position.set(0, 0, 0);
        root.add(pelvis);
        SkeletonFactory.createTorsoBox(pelvis, new THREE.Vector3(0, 0, 0), SKELETON_CONFIG.pelvisLength, SKELETON_CONFIG.boneRadius.torso, colors.spine);

        const spine = new THREE.Object3D();
        spine.position.set(0, 0, 0);
        pelvis.add(spine);
        SkeletonFactory.createTorsoBox(spine, new THREE.Vector3(0, 0, 0), SKELETON_CONFIG.torsoLength, SKELETON_CONFIG.boneRadius.torso, colors.spine);

        const shoulderY = SKELETON_CONFIG.torsoLength;
        const shoulders = new THREE.Object3D();
        shoulders.position.set(0, shoulderY, 0);
        spine.add(shoulders);

        SkeletonFactory.createBoneCylinder(shoulders, leftShoulderPos, rightShoulderPos, SKELETON_CONFIG.boneRadius.shoulder, colors.spine).visible = false;

        const head = new THREE.Object3D();
        head.position.set(0, 0, 0);
        shoulders.add(head);
        SkeletonFactory.createHeadSphere(head, new THREE.Vector3(0, SKELETON_CONFIG.headRadius, 0), SKELETON_CONFIG.headRadius, colors.head);

        const gunGroup = new THREE.Object3D();
        gunGroup.position.set(0, 0, 0);
        shoulders.add(gunGroup);
        skeleton.gunGroup = gunGroup;
        skeleton.shoulders = shoulders;

        const gunColor = 0xff8800;
        const gunSegLength = SKELETON_CONFIG.gunLength / 3;
        const darkGunLength = SKELETON_CONFIG.gunLength / 7;

        SkeletonFactory.createBoneCylinder(gunGroup, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, darkGunLength), SKELETON_CONFIG.boneRadius.gun, 0x333333);
        SkeletonFactory.createBoneCylinder(gunGroup, new THREE.Vector3(0, 0, darkGunLength), new THREE.Vector3(0, 0, gunSegLength), SKELETON_CONFIG.boneRadius.gun, gunColor);
        SkeletonFactory.createBoneCylinder(gunGroup, new THREE.Vector3(0, 0, gunSegLength), new THREE.Vector3(0, 0, gunSegLength * 2), SKELETON_CONFIG.boneRadius.gun, gunColor);
        SkeletonFactory.createBoneCylinder(gunGroup, new THREE.Vector3(0, 0, gunSegLength * 2), new THREE.Vector3(0, 0, gunSegLength * 3), SKELETON_CONFIG.boneRadius.gun, gunColor);

        const barrelEnd = new THREE.Vector3(0, 0, gunSegLength * 3);
        const barrelLength = 0.1;
        const barrelRadius = SKELETON_CONFIG.boneRadius.gun / 2;
        SkeletonFactory.createBoneCylinder(gunGroup, barrelEnd, new THREE.Vector3(0, 0, gunSegLength * 3 + barrelLength), barrelRadius, gunColor);

        const scopeGeometry = new THREE.CylinderGeometry(barrelRadius, barrelRadius, 0.05, 8);
        const scopeMaterial = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
        const scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
        scope.rotation.x = Math.PI / 2;
        scope.position.set(0, barrelRadius * 1.5, gunSegLength * 2.8);
        gunGroup.add(scope);

        const leftUpperArm = new THREE.Object3D();
        leftUpperArm.position.copy(leftShoulderPos);
        shoulders.add(leftUpperArm);
        skeleton.leftUpperArm = leftUpperArm;

        SkeletonFactory.createBoneCylinder(leftUpperArm, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.upperArmLength, 0), SKELETON_CONFIG.boneRadius.upperArm, colors.leftArm);

        const leftForearm = new THREE.Object3D();
        leftForearm.position.set(0, -SKELETON_CONFIG.upperArmLength, 0);
        leftUpperArm.add(leftForearm);
        skeleton.leftForearm = leftForearm;

        SkeletonFactory.createBoneCylinder(leftForearm, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.forearmLength, 0), SKELETON_CONFIG.boneRadius.forearm, colors.leftArm);

        const rightUpperArm = new THREE.Object3D();
        rightUpperArm.position.copy(rightShoulderPos);
        shoulders.add(rightUpperArm);
        skeleton.rightUpperArm = rightUpperArm;

        SkeletonFactory.createBoneCylinder(rightUpperArm, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.upperArmLength, 0), SKELETON_CONFIG.boneRadius.upperArm, colors.rightArm);

        const rightForearm = new THREE.Object3D();
        rightForearm.position.set(0, -SKELETON_CONFIG.upperArmLength, 0);
        rightUpperArm.add(rightForearm);
        skeleton.rightForearm = rightForearm;

        SkeletonFactory.createBoneCylinder(rightForearm, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.forearmLength, 0), SKELETON_CONFIG.boneRadius.forearm, colors.rightArm);

        const leftThigh = new THREE.Object3D();
        leftThigh.position.copy(leftHipPos);
        pelvis.add(leftThigh);
        skeleton.leftThigh = leftThigh;

        SkeletonFactory.createBoneCylinder(leftThigh, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.thighLength, 0), SKELETON_CONFIG.boneRadius.thigh, colors.leftLeg);

        const leftShin = new THREE.Object3D();
        leftShin.position.set(0, -SKELETON_CONFIG.thighLength, 0);
        leftThigh.add(leftShin);
        skeleton.leftShin = leftShin;

        SkeletonFactory.createBoneCylinder(leftShin, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.shinLength, 0), SKELETON_CONFIG.boneRadius.shin, colors.leftLeg);
        SkeletonFactory.createFoot(leftShin, new THREE.Vector3(0, -SKELETON_CONFIG.shinLength, 0), SKELETON_CONFIG.boneRadius.thigh);

        const rightThigh = new THREE.Object3D();
        rightThigh.position.copy(rightHipPos);
        pelvis.add(rightThigh);
        skeleton.rightThigh = rightThigh;

        SkeletonFactory.createBoneCylinder(rightThigh, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.thighLength, 0), SKELETON_CONFIG.boneRadius.thigh, colors.rightLeg);

        const rightShin = new THREE.Object3D();
        rightShin.position.set(0, -SKELETON_CONFIG.thighLength, 0);
        rightThigh.add(rightShin);
        skeleton.rightShin = rightShin;

        SkeletonFactory.createBoneCylinder(rightShin, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.shinLength, 0), SKELETON_CONFIG.boneRadius.shin, colors.rightLeg);
        SkeletonFactory.createFoot(rightShin, new THREE.Vector3(0, -SKELETON_CONFIG.shinLength, 0), SKELETON_CONFIG.boneRadius.thigh);

        skeleton.leftShoulderPos = leftShoulderPos.clone();
        skeleton.rightShoulderPos = rightShoulderPos.clone();

        return skeleton;
    }

    static createTorsoBox(parent, start, height, radius, color) {
        const geometry = new THREE.BoxGeometry(radius * 1.6, height, radius);
        const material = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
        const box = new THREE.Mesh(geometry, material);
        box.position.set(0, height / 2, 0);
        parent.add(box);
        return box;
    }

    static createHeadSphere(parent, position, radius, color) {
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);
        parent.add(sphere);

        const faceColor = 0x000000;
        const faceMaterial = new THREE.MeshBasicMaterial({ color: faceColor });

        const eyeRadius = radius * 0.15;
        const eyeGeometry = new THREE.SphereGeometry(eyeRadius, 8, 8);
        const leftEye = new THREE.Mesh(eyeGeometry, faceMaterial);
        leftEye.position.set(radius * 0.3, radius * 0.2, radius * 0.85);
        sphere.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, faceMaterial);
        rightEye.position.set(-radius * 0.3, radius * 0.2, radius * 0.85);
        sphere.add(rightEye);

        const noseRadius = radius * 0.1;
        const noseGeometry = new THREE.SphereGeometry(noseRadius, 8, 8);
        const nose = new THREE.Mesh(noseGeometry, faceMaterial);
        nose.position.set(0, 0, radius * 0.95);
        sphere.add(nose);

        const mouthRadius = radius * 0.2;
        const mouthGeometry = new THREE.SphereGeometry(mouthRadius, 8, 8);
        mouthGeometry.scale(1, 0.3, 0.5);
        const mouth = new THREE.Mesh(mouthGeometry, faceMaterial);
        mouth.position.set(0, -radius * 0.3, radius * 0.85);
        sphere.add(mouth);

        const earRadius = radius * 0.15;
        const earGeometry = new THREE.SphereGeometry(earRadius, 8, 8);
        const leftEar = new THREE.Mesh(earGeometry, faceMaterial);
        leftEar.position.set(radius * 0.9, 0, 0);
        sphere.add(leftEar);

        const rightEar = new THREE.Mesh(earGeometry, faceMaterial);
        rightEar.position.set(-radius * 0.9, 0, 0);
        sphere.add(rightEar);

        return sphere;
    }

    static createBoneCylinder(parent, start, end, radius, color) {
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        
        const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
        
        const material = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
        const cylinder = new THREE.Mesh(geometry, material);
        
        const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        cylinder.position.copy(midPoint);
        
        if (length > 0.0001) {
            const up = new THREE.Vector3(0, 1, 0);
            const dir = direction.clone().normalize();
            
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(up, dir);
            cylinder.quaternion.copy(quaternion);
        }
        
        parent.add(cylinder);
        return cylinder;
    }

    static createFoot(parent, position, radius) {
        const footGeometry = new THREE.SphereGeometry(radius, 8, 8);
        const footMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
        const foot = new THREE.Mesh(footGeometry, footMaterial);
        foot.position.copy(position);
        foot.scale.set(1.2, 0.6, 1.8);
        parent.add(foot);
        return foot;
    }
}
