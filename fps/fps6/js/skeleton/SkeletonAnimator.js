class SkeletonAnimator {
    static connectArmToTarget(upperArm, forearm, shoulderPos, targetPos, isLeftArm) {
        const upperArmLength = SKELETON_CONFIG.upperArmLength;
        const forearmLength = SKELETON_CONFIG.forearmLength;
        
        const dx = targetPos.x - shoulderPos.x;
        const dy = targetPos.y - shoulderPos.y;
        const dz = targetPos.z - shoulderPos.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        const targetDir = new THREE.Vector3(dx, dy, dz).normalize();
        
        const distFromShoulder = (upperArmLength * upperArmLength - forearmLength * forearmLength + distance * distance) / (2 * distance);
        const height = Math.sqrt(Math.max(0, upperArmLength * upperArmLength - distFromShoulder * distFromShoulder));
        
        const basePoint = new THREE.Vector3(
            shoulderPos.x + targetDir.x * distFromShoulder,
            shoulderPos.y + targetDir.y * distFromShoulder,
            shoulderPos.z + targetDir.z * distFromShoulder
        );
        
        const worldUp = new THREE.Vector3(0, 1, 0);
        const sideDir = new THREE.Vector3().crossVectors(targetDir, worldUp).normalize();
        if (sideDir.lengthSq() < 0.001) {
            sideDir.set(isLeftArm ? 1 : -1, 0, 0);
        }
        if ((isLeftArm && sideDir.x < 0) || (!isLeftArm && sideDir.x > 0)) {
            sideDir.negate();
        }
        
        const downDir = new THREE.Vector3().crossVectors(sideDir, targetDir).normalize();
        if (downDir.y > 0) {
            downDir.negate();
        }
        
        const blendFactor = 0.6;
        const elbowDir = new THREE.Vector3(
            sideDir.x * (1 - blendFactor) + downDir.x * blendFactor,
            sideDir.y * (1 - blendFactor) + downDir.y * blendFactor,
            sideDir.z * (1 - blendFactor) + downDir.z * blendFactor
        ).normalize();
        
        const elbowPos = new THREE.Vector3(
            basePoint.x + elbowDir.x * height,
            basePoint.y + elbowDir.y * height,
            basePoint.z + elbowDir.z * height
        );
        
        upperArm.rotation.set(0, 0, 0);
        const upperArmTarget = new THREE.Vector3(
            elbowPos.x - shoulderPos.x,
            elbowPos.y - shoulderPos.y,
            elbowPos.z - shoulderPos.z
        ).normalize();
        
        const defaultDir = new THREE.Vector3(0, -1, 0);
        const rotAxis = new THREE.Vector3().crossVectors(defaultDir, upperArmTarget).normalize();
        const rotAngle = Math.acos(Math.max(-1, Math.min(1, defaultDir.dot(upperArmTarget))));
        
        if (rotAxis.lengthSq() > 0.001) {
            upperArm.rotateOnAxis(rotAxis, rotAngle);
        }
        
        forearm.rotation.set(0, 0, 0);
        const forearmTarget = new THREE.Vector3(
            targetPos.x - elbowPos.x,
            targetPos.y - elbowPos.y,
            targetPos.z - elbowPos.z
        ).normalize();
        
        const localForearmTarget = forearmTarget.clone().applyQuaternion(upperArm.quaternion.clone().invert());
        
        const forearmRotAxis = new THREE.Vector3().crossVectors(defaultDir, localForearmTarget).normalize();
        const forearmRotAngle = Math.acos(Math.max(-1, Math.min(1, defaultDir.dot(localForearmTarget))));
        
        if (forearmRotAxis.lengthSq() > 0.001) {
            forearm.rotateOnAxis(forearmRotAxis, forearmRotAngle);
        }
    }

    static updatePose(skeleton, gunAngle) {
        const maxAngle = 60;
        const clampedAngle = Math.max(-maxAngle, Math.min(maxAngle, gunAngle));
        const gunAngleRad = THREE.MathUtils.degToRad(clampedAngle);
        
        skeleton.gunGroup.rotation.set(gunAngleRad, 0, 0);
        skeleton.gunGroup.updateMatrix();
        
        const gunMiddlePos = new THREE.Vector3(0, 0, SKELETON_CONFIG.gunLength / 3);
        const gunEndPos = new THREE.Vector3(0, 0, SKELETON_CONFIG.gunLength * 2 / 3);
        
        gunMiddlePos.applyMatrix4(skeleton.gunGroup.matrix);
        gunEndPos.applyMatrix4(skeleton.gunGroup.matrix);
        
        SkeletonAnimator.connectArmToTarget(
            skeleton.leftUpperArm, 
            skeleton.leftForearm, 
            skeleton.leftShoulderPos, 
            gunEndPos, 
            true
        );
        
        SkeletonAnimator.connectArmToTarget(
            skeleton.rightUpperArm, 
            skeleton.rightForearm, 
            skeleton.rightShoulderPos, 
            gunMiddlePos, 
            false
        );
    }

    static setStandPose(skeleton) {
        const baseRootY = SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength;
        skeleton.leftThigh.rotation.x = 0;
        skeleton.rightThigh.rotation.x = 0;
        skeleton.leftShin.rotation.x = 0;
        skeleton.rightShin.rotation.x = 0;
        skeleton.root.position.y = baseRootY;
    }

    static setRunningPose(skeleton, animTime) {
        const swingAngle = Math.sin(animTime) * CHARACTER_CONFIG.swingAngle;
        const swingAngleOpposite = Math.sin(animTime + Math.PI) * CHARACTER_CONFIG.swingAngle;
        
        skeleton.leftThigh.rotation.x = swingAngle;
        skeleton.rightThigh.rotation.x = swingAngleOpposite;
        
        const leftKneeBend = swingAngle > 0 ? swingAngle * CHARACTER_CONFIG.kneeBendFactor : 0;
        const rightKneeBend = swingAngleOpposite > 0 ? swingAngleOpposite * CHARACTER_CONFIG.kneeBendFactor : 0;
        
        skeleton.leftShin.rotation.x = leftKneeBend;
        skeleton.rightShin.rotation.x = rightKneeBend;
    }

    static setCrouchPose(skeleton) {
        const leftThighAngle = -Math.PI / 2;
        const leftShinAngle = Math.PI / 2;
        skeleton.leftThigh.rotation.x = leftThighAngle;
        skeleton.leftShin.rotation.x = leftShinAngle;
        
        const rightThighAngle = 0;
        const rightShinAngle = Math.PI / 2;
        skeleton.rightThigh.rotation.x = rightThighAngle;
        skeleton.rightShin.rotation.x = rightShinAngle;
        
        skeleton.root.position.y = SKELETON_CONFIG.thighLength;
    }

    static setJumpPose(skeleton, jumpHeight) {
        const baseRootY = SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength;
        const slightBend = 0.3;
        skeleton.leftThigh.rotation.x = -slightBend;
        skeleton.rightThigh.rotation.x = -slightBend;
        skeleton.leftShin.rotation.x = slightBend * 0.8;
        skeleton.rightShin.rotation.x = slightBend * 0.8;
        skeleton.root.position.y = baseRootY + jumpHeight;
    }

    static setLieDownPose(skeleton) {
        skeleton.root.rotation.x = -Math.PI / 2;
        skeleton.root.position.y = SKELETON_CONFIG.boneRadius.torso;

        skeleton.leftThigh.rotation.x = 0;
        skeleton.rightThigh.rotation.x = 0;
        skeleton.leftShin.rotation.x = 0;
        skeleton.rightShin.rotation.x = 0;

        skeleton.leftUpperArm.rotation.set(0, 0, 0);
        skeleton.leftForearm.rotation.set(0, 0, 0);
        skeleton.rightUpperArm.rotation.set(0, 0, 0);
        skeleton.rightForearm.rotation.set(0, 0, 0);

        skeleton.gunGroup.visible = false;
    }
}
