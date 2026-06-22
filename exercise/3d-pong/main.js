let scene, camera, renderer, controls;
let cube, redPaddle, greenPaddle, ball, ballGlow;
let ballVelocity;
let redScore = 0, greenScore = 0;
let redPaddleMode = 'human', greenPaddleMode = 'human';
let keyState = {};
let moveSpeed = 0.1;
let aiMoveSpeed = 0.05;
let minPos = -5.5, maxPos = 5.5;
let redPaddlePrevPos = { x: 0, y: 0 };
let greenPaddlePrevPos = { x: 0, y: 0 };
let isPaused = false;
let gameStarted = false;
let maxScore = 10;
let frameCount = 0;
let buffFrequency = 3;
let buffs = [];
let activeBuffs = { red: [], green: [] };
let balls = [];
let audioContext;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(25, 0, 0);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    createStarfield();
    createAxes();
    createCube();
    createPaddles();
    createBall();
    
    setupEventListeners();
    animate();
}

function createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 500;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
        const radius = 20 + Math.random() * 30;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.2,
        transparent: true,
        opacity: 0.8
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

function createAxes() {
    const arrowOrigin = new THREE.Vector3(0, 0, 0);
    const arrowLength = 20;

    const xAxis = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), arrowOrigin, arrowLength, 0xff0000, 1, 0.5);
    const yAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), arrowOrigin, arrowLength, 0x00ff00, 1, 0.5);
    const zAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), arrowOrigin, arrowLength, 0x0000ff, 1, 0.5);

    scene.add(xAxis);
    scene.add(yAxis);
    scene.add(zAxis);
}

function createCube() {
    const cubeSize = 15;
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    scene.add(cube);

    const edgesGeometry = new THREE.EdgesGeometry(cubeGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
        color: 0x48dbfb,
        transparent: true,
        opacity: 0.6,
        depthWrite: false
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    edges.renderOrder = 1;
    cube.add(edges);
}

function createPaddles() {
    const paddleGeometry = new THREE.BoxGeometry(4, 4, 0.3);

    const redPaddleMaterial = new THREE.MeshBasicMaterial({ color: 0xff6666 });
    redPaddle = new THREE.Mesh(paddleGeometry, redPaddleMaterial);
    redPaddle.position.set(0, 0, 7.25);
    redPaddle.userData.originalScale = { x: 1, y: 1, z: 1 };
    scene.add(redPaddle);

    const greenPaddleMaterial = new THREE.MeshBasicMaterial({ color: 0x66ff66 });
    greenPaddle = new THREE.Mesh(paddleGeometry, greenPaddleMaterial);
    greenPaddle.position.set(0, 0, -7.25);
    greenPaddle.userData.originalScale = { x: 1, y: 1, z: 1 };
    scene.add(greenPaddle);
}

function createBall() {
    const ballGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(0, 0, 0);
    scene.add(ball);

    const glowGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3
    });
    ballGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    ball.add(ballGlow);

    balls = [{ mesh: ball, velocity: new THREE.Vector3() }];
    resetBall();
}

function resetBall() {
    ball.position.set(0, 0, 0);
    ballVelocity = new THREE.Vector3(
        (Math.random() > 0.5 ? 1 : -1) * 0.05,
        (Math.random() > 0.5 ? 1 : -1) * 0.05,
        0.05 * 1.6
    );
    balls[0].velocity.copy(ballVelocity);
}

function resetGame() {
    redScore = 0;
    greenScore = 0;
    document.querySelector('#red-score .score-value').textContent = '0';
    document.querySelector('#green-score .score-value').textContent = '0';
    resetBall();
    activeBuffs = { red: [], green: [] };
    updateBuffDisplay();
    resetPaddles();
}

function resetPaddles() {
    redPaddle.position.set(0, 0, 7.25);
    greenPaddle.position.set(0, 0, -7.25);
    redPaddle.scale.set(1, 1, 1);
    greenPaddle.scale.set(1, 1, 1);
}

function setupEventListeners() {
    window.addEventListener('keydown', (e) => { keyState[e.key] = true; });
    window.addEventListener('keyup', (e) => { keyState[e.key] = false; });

    document.getElementById('start-game-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    document.getElementById('settings-btn').addEventListener('click', () => showSettings(true));
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    document.getElementById('cancel-settings').addEventListener('click', () => showSettings(false));

    document.getElementById('red-human').addEventListener('click', () => setPaddleMode('red', 'human'));
    document.getElementById('red-ai').addEventListener('click', () => setPaddleMode('red', 'ai'));
    document.getElementById('green-human').addEventListener('click', () => setPaddleMode('green', 'human'));
    document.getElementById('green-ai').addEventListener('click', () => setPaddleMode('green', 'ai'));

    document.getElementById('buff-frequency').addEventListener('input', (e) => {
        document.getElementById('buff-frequency-value').textContent = e.target.value;
    });

    window.addEventListener('resize', onWindowResize);
}

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    gameStarted = true;
    initAudio();
}

function restartGame() {
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    resetGame();
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-btn').querySelector('span').textContent = isPaused ? '▶ 继续' : '⏸ 暂停';
}

function showSettings(show) {
    if (show) {
        document.getElementById('settings-panel').classList.remove('hidden');
    } else {
        document.getElementById('settings-panel').classList.add('hidden');
    }
}

function saveSettings() {
    buffFrequency = parseInt(document.getElementById('buff-frequency').value);
    maxScore = parseInt(document.getElementById('max-score').value);
    showSettings(false);
}

function setPaddleMode(player, mode) {
    if (player === 'red') {
        redPaddleMode = mode;
        document.getElementById('red-human').classList.toggle('active', mode === 'human');
        document.getElementById('red-ai').classList.toggle('active', mode === 'ai');
    } else {
        greenPaddleMode = mode;
        document.getElementById('green-human').classList.toggle('active', mode === 'human');
        document.getElementById('green-ai').classList.toggle('active', mode === 'ai');
    }
}

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playHitSound() {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playWallSound() {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
}

function playScoreSound() {
    if (!audioContext) return;
    const frequencies = [523.25, 659.25, 783.99];
    
    frequencies.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + i * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(audioContext.currentTime + i * 0.1);
        oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3);
    });
}

function moveAIPaddle(paddle, ballPos, ballVel, paddleZ) {
    const timeToReach = (paddleZ - ballPos.z) / ballVel.z;

    if (timeToReach > 0 && ballVel.z !== 0) {
        const predictedX = ballPos.x + timeToReach * ballVel.x;
        const predictedY = ballPos.y + timeToReach * ballVel.y;

        const dx = predictedX - paddle.position.x;
        const dy = predictedY - paddle.position.y;

        paddle.position.x += Math.max(-aiMoveSpeed, Math.min(aiMoveSpeed, dx));
        paddle.position.y += Math.max(-aiMoveSpeed, Math.min(aiMoveSpeed, dy));
    } else {
        paddle.position.x += Math.max(-aiMoveSpeed, Math.min(aiMoveSpeed, -paddle.position.x));
        paddle.position.y += Math.max(-aiMoveSpeed, Math.min(aiMoveSpeed, -paddle.position.y));
    }

    paddle.position.x = Math.max(minPos, Math.min(maxPos, paddle.position.x));
    paddle.position.y = Math.max(minPos, Math.min(maxPos, paddle.position.y));
}

function updatePaddles() {
    redPaddlePrevPos = { x: redPaddle.position.x, y: redPaddle.position.y };
    greenPaddlePrevPos = { x: greenPaddle.position.x, y: greenPaddle.position.y };

    if (redPaddleMode === 'human') {
        if (keyState['w'] || keyState['W']) redPaddle.position.y = Math.min(maxPos, redPaddle.position.y + moveSpeed);
        if (keyState['s'] || keyState['S']) redPaddle.position.y = Math.max(minPos, redPaddle.position.y - moveSpeed);
        if (keyState['a'] || keyState['A']) redPaddle.position.x = Math.max(minPos, redPaddle.position.x - moveSpeed);
        if (keyState['d'] || keyState['D']) redPaddle.position.x = Math.min(maxPos, redPaddle.position.x + moveSpeed);
    } else {
        moveAIPaddle(redPaddle, ball.position, ballVelocity, 7.25);
    }

    if (greenPaddleMode === 'human') {
        if (keyState['ArrowUp']) greenPaddle.position.y = Math.min(maxPos, greenPaddle.position.y + moveSpeed);
        if (keyState['ArrowDown']) greenPaddle.position.y = Math.max(minPos, greenPaddle.position.y - moveSpeed);
        if (keyState['ArrowLeft']) greenPaddle.position.x = Math.max(minPos, greenPaddle.position.x - moveSpeed);
        if (keyState['ArrowRight']) greenPaddle.position.x = Math.min(maxPos, greenPaddle.position.x + moveSpeed);
    } else {
        moveAIPaddle(greenPaddle, ball.position, ballVelocity, -7.25);
    }
}

function updateBalls() {
    balls.forEach((ballObj, index) => {
        const b = ballObj.mesh;
        const vel = ballObj.velocity;
        
        b.position.add(vel);

        if (b.position.x >= 7.0 || b.position.x <= -7.0) {
            vel.x = -vel.x;
            b.position.x = Math.sign(b.position.x) * 6.99;
            playWallSound();
        }
        if (b.position.y >= 7.0 || b.position.y <= -7.0) {
            vel.y = -vel.y;
            b.position.y = Math.sign(b.position.y) * 6.99;
            playWallSound();
        }

        const paddleRadius = 2;

        if (vel.z > 0) {
            if (b.position.z + 0.5 >= 7.25 && b.position.z <= 7.5) {
                const dx = Math.abs(b.position.x - redPaddle.position.x);
                const dy = Math.abs(b.position.y - redPaddle.position.y);
                if (dx <= paddleRadius && dy <= paddleRadius) {
                    vel.z = -vel.z;
                    
                    const hitPosRelX = (b.position.x - redPaddle.position.x) / paddleRadius;
                    const hitPosRelY = (b.position.y - redPaddle.position.y) / paddleRadius;
                    vel.x += hitPosRelX * 0.05;
                    vel.y += hitPosRelY * 0.05;
                    
                    const paddleVelX = redPaddle.position.x - redPaddlePrevPos.x;
                    const paddleVelY = redPaddle.position.y - redPaddlePrevPos.y;
                    vel.x += paddleVelX * 0.3;
                    vel.y += paddleVelY * 0.3;
                    
                    applyPaddleEffects(redPaddle, 'red');
                    playHitSound();
                }
            }
        } else {
            if (b.position.z - 0.5 <= -7.25 && b.position.z >= -7.5) {
                const dx = Math.abs(b.position.x - greenPaddle.position.x);
                const dy = Math.abs(b.position.y - greenPaddle.position.y);
                if (dx <= paddleRadius && dy <= paddleRadius) {
                    vel.z = -vel.z;
                    
                    const hitPosRelX = (b.position.x - greenPaddle.position.x) / paddleRadius;
                    const hitPosRelY = (b.position.y - greenPaddle.position.y) / paddleRadius;
                    vel.x += hitPosRelX * 0.05;
                    vel.y += hitPosRelY * 0.05;
                    
                    const paddleVelX = greenPaddle.position.x - greenPaddlePrevPos.x;
                    const paddleVelY = greenPaddle.position.y - greenPaddlePrevPos.y;
                    vel.x += paddleVelX * 0.3;
                    vel.y += paddleVelY * 0.3;
                    
                    applyPaddleEffects(greenPaddle, 'green');
                    playHitSound();
                }
            }
        }

        if (b.position.z > 7.5) {
            if (index === 0) {
                greenScore++;
                document.querySelector('#green-score .score-value').textContent = greenScore;
                playScoreSound();
                checkGameOver();
                resetBall();
            } else {
                scene.remove(b);
                balls.splice(index, 1);
            }
        }
        if (b.position.z < -7.5) {
            if (index === 0) {
                redScore++;
                document.querySelector('#red-score .score-value').textContent = redScore;
                playScoreSound();
                checkGameOver();
                resetBall();
            } else {
                scene.remove(b);
                balls.splice(index, 1);
            }
        }
    });
}

function applyPaddleEffects(paddle, player) {
    activeBuffs[player].forEach(buff => {
        if (buff.type === 'enlarge') {
            paddle.scale.set(1.5, 1.5, 1);
        } else if (buff.type === 'shrink') {
            const opponent = player === 'red' ? greenPaddle : redPaddle;
            opponent.scale.set(0.6, 0.6, 1);
        } else if (buff.type === 'slow') {
            balls.forEach(ballObj => {
                ballObj.velocity.multiplyScalar(0.7);
            });
        } else if (buff.type === 'split') {
            splitBall();
        }
    });
    
    setTimeout(() => {
        paddle.scale.set(1, 1, 1);
    }, 3000);
}

function splitBall() {
    const mainBall = balls[0];
    const vel = mainBall.velocity;
    
    const ball1Vel = new THREE.Vector3(vel.x + 0.03, vel.y + 0.03, vel.z);
    const ball2Vel = new THREE.Vector3(vel.x - 0.03, vel.y - 0.03, vel.z);
    
    const ballGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const ball1 = new THREE.Mesh(ballGeometry, ballMaterial);
    ball1.position.copy(mainBall.mesh.position);
    scene.add(ball1);
    balls.push({ mesh: ball1, velocity: ball1Vel });
    
    const ball2 = new THREE.Mesh(ballGeometry, ballMaterial);
    ball2.position.copy(mainBall.mesh.position);
    scene.add(ball2);
    balls.push({ mesh: ball2, velocity: ball2Vel });
}

function checkGameOver() {
    if (redScore >= maxScore || greenScore >= maxScore) {
        isPaused = true;
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('game-over').classList.remove('hidden');
        
        const winner = redScore >= maxScore ? '红方' : '绿方';
        document.getElementById('winner-text').textContent = winner + ' 获胜！';
        document.getElementById('final-red').textContent = redScore;
        document.getElementById('final-green').textContent = greenScore;
    }
}

function spawnBuff() {
    if (buffFrequency === 0) return;
    
    const buffTypes = ['enlarge', 'shrink', 'slow', 'split'];
    const buffType = buffTypes[Math.floor(Math.random() * buffTypes.length)];
    const colors = {
        enlarge: 0x2ecc71,
        shrink: 0xf39c12,
        slow: 0x3498db,
        split: 0xe74c3c
    };
    
    const side = Math.random() > 0.5 ? 1 : -1;
    const x = (Math.random() - 0.5) * 10;
    const y = (Math.random() - 0.5) * 10;
    const z = side * 6;
    
    const buffGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const buffMaterial = new THREE.MeshBasicMaterial({
        color: colors[buffType],
        transparent: true,
        opacity: 0.8
    });
    const buff = new THREE.Mesh(buffGeometry, buffMaterial);
    buff.position.set(x, y, z);
    buff.userData = { type: buffType, spawnTime: Date.now() };
    
    const glowGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: colors[buffType],
        transparent: true,
        opacity: 0.3
    });
    const buffGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    buff.add(buffGlow);
    
    scene.add(buff);
    buffs.push(buff);
}

function updateBuffs() {
    buffs.forEach((buff, index) => {
        buff.rotation.x += 0.02;
        buff.rotation.y += 0.02;
        
        const scale = 1 + Math.sin(Date.now() * 0.005) * 0.2;
        buff.children[0].scale.set(scale, scale, scale);
        
        balls.forEach(ballObj => {
            const distance = buff.position.distanceTo(ballObj.mesh.position);
            if (distance < 0.8) {
                const buffType = buff.userData.type;
                const player = ballObj.mesh.position.z > 0 ? 'red' : 'green';
                
                activeBuffs[player].push({
                    type: buffType,
                    duration: 3000
                });
                
                scene.remove(buff);
                buffs.splice(index, 1);
                updateBuffDisplay();
            }
        });
    });
    
    Object.keys(activeBuffs).forEach(player => {
        activeBuffs[player] = activeBuffs[player].filter(buff => {
            buff.duration -= 16;
            return buff.duration > 0;
        });
    });
    updateBuffDisplay();
}

function updateBuffDisplay() {
    ['red', 'green'].forEach(player => {
        const container = document.querySelector(`#player${player === 'red' ? '1' : '2'}-buffs .buff-list`);
        container.innerHTML = '';
        
        activeBuffs[player].forEach(buff => {
            const buffEl = document.createElement('span');
            buffEl.className = `buff-item ${buff.type}`;
            const names = { enlarge: '放大', shrink: '缩小', slow: '减速', split: '分裂' };
            buffEl.textContent = names[buff.type];
            container.appendChild(buffEl);
        });
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (!isPaused && gameStarted) {
        frameCount++;
        
        if (frameCount % (600 / buffFrequency) === 0 && buffFrequency > 0) {
            spawnBuff();
        }
        
        updatePaddles();
        updateBalls();
        updateBuffs();
    }
    
    controls.update();
    renderer.render(scene, camera);
}

init();