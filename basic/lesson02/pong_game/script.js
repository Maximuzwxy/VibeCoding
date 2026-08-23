// Game configuration
let gameConfig = {
    buffFrequency: 3, // 0-5 (0 = no buffs, 5 = 5 blocks per 10 rounds)
    ballBaseSpeed: 5,
    ballMinSpeed: 2,
    ballMaxSpeed: 12,
    ballSpeedRatio: 1.1,
    paddleMinLength: 60,
    paddleMaxLength: 120,
    paddleSizeRatio: 1.2
};

// Game elements
const gameContainer = document.getElementById('game-container');
const ball = document.getElementById('ball');
const player1Paddle = document.getElementById('player1-paddle');
const player2Paddle = document.getElementById('player2-paddle');
const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const saveSettingsBtn = document.getElementById('save-settings');
const cancelSettingsBtn = document.getElementById('cancel-settings');
const leftHumanBtn = document.getElementById('left-human');
const leftPCBtn = document.getElementById('left-pc');
const rightHumanBtn = document.getElementById('right-human');
const rightPCBtn = document.getElementById('right-pc');
const controlsText = document.getElementById('controls');
const player1BuffsDisplay = document.getElementById('player1-buffs');
const player2BuffsDisplay = document.getElementById('player2-buffs');

// Buff elements
const buffBlocks = {
    slow1: document.getElementById('buff-slow1'),
    split1: document.getElementById('buff-split1'),
    color1: document.getElementById('buff-color1'),
    enlarge1: document.getElementById('buff-enlarge1'),
    shrink1: document.getElementById('buff-shrink1'),
    slow2: document.getElementById('buff-slow2'),
    split2: document.getElementById('buff-split2'),
    color2: document.getElementById('buff-color2'),
    enlarge2: document.getElementById('buff-enlarge2'),
    shrink2: document.getElementById('buff-shrink2')
};

// Settings elements
const buffFrequencySlider = document.getElementById('buff-frequency');
const buffFrequencyValue = document.getElementById('buff-frequency-value');
const ballBaseSpeedInput = document.getElementById('ball-base-speed');
const ballMinSpeedInput = document.getElementById('ball-min-speed');
const ballMaxSpeedInput = document.getElementById('ball-max-speed');
const ballSpeedRatioInput = document.getElementById('ball-speed-ratio');
const paddleMinLengthInput = document.getElementById('paddle-min-length');
const paddleMaxLengthInput = document.getElementById('paddle-max-length');
const paddleSizeRatioInput = document.getElementById('paddle-size-ratio');

// Game variables
const gameWidth = gameContainer.offsetWidth;
const gameHeight = gameContainer.offsetHeight;
const paddleWidth = player1Paddle.offsetWidth;
const ballSize = ball.offsetWidth;
const paddleLeftX = 60; // X position of left paddle
const paddleRightX = gameWidth - 60 - paddleWidth; // X position of right paddle

let ballX = gameWidth / 2;
let ballY = gameHeight / 2;
let ballSpeedX = gameConfig.ballBaseSpeed;
let ballSpeedY = gameConfig.ballBaseSpeed;
let originalBallSpeedX = gameConfig.ballBaseSpeed;
let originalBallSpeedY = gameConfig.ballBaseSpeed;
let player1Score = 0;
let player2Score = 0;
let player1PaddleY = (gameHeight - 100) / 2;
let player2PaddleY = (gameHeight - 100) / 2;
let isGameRunning = false;
let isGamePaused = false;
let animationId;
let roundsCompleted = 0;
let ballCrossings = 0;
let lastBuffCheckRound = 0;
let buffGenerationCounter = 0;

// Control modes
let leftPlayerMode = 'human'; // 'human' or 'pc'
let rightPlayerMode = 'human'; // 'human' or 'pc'

// Keyboard controls
let wPressed = false;
let sPressed = false;
let upPressed = false;
let downPressed = false;

// Buff system
let activeBuffs = {
    player1: {},
    player2: {}
};

// Ball clones for split effect
let ballClones = [];

// Initialize UI with config values
function initUI() {
    buffFrequencySlider.value = gameConfig.buffFrequency;
    buffFrequencyValue.textContent = gameConfig.buffFrequency;
    ballBaseSpeedInput.value = gameConfig.ballBaseSpeed;
    ballMinSpeedInput.value = gameConfig.ballMinSpeed;
    ballMaxSpeedInput.value = gameConfig.ballMaxSpeed;
    ballSpeedRatioInput.value = gameConfig.ballSpeedRatio;
    paddleMinLengthInput.value = gameConfig.paddleMinLength;
    paddleMaxLengthInput.value = gameConfig.paddleMaxLength;
    paddleSizeRatioInput.value = gameConfig.paddleSizeRatio;
    
    // Set paddle to initial size
    player1Paddle.style.height = '100px';
    player2Paddle.style.height = '100px';
}

// Initialize game
function initGame() {
    // Reset ball position
    ballX = gameWidth / 2;
    ballY = gameHeight / 2;
    
    // Reset ball speed based on config
    ballSpeedX = gameConfig.ballBaseSpeed;
    ballSpeedY = gameConfig.ballBaseSpeed;
    originalBallSpeedX = gameConfig.ballBaseSpeed;
    originalBallSpeedY = gameConfig.ballBaseSpeed;
    
    // Reset paddles
    player1PaddleY = (gameHeight - 100) / 2;
    player2PaddleY = (gameHeight - 100) / 2;
    
    // Reset paddle sizes
    player1Paddle.style.height = '100px';
    player2Paddle.style.height = '100px';
    
    // Reset ball color
    ball.style.backgroundColor = '#fff';
    
    // Clear any ball clones
    clearBallClones();
    
    // Reset rounds
    roundsCompleted = 0;
    ballCrossings = 0;
    lastBuffCheckRound = 0;
    buffGenerationCounter = 0;
    
    // Update display
    updateGameElements();
    
    // Hide all buff blocks initially
    Object.values(buffBlocks).forEach(block => {
        block.style.display = 'none';
    });
    
    // Reset buff displays
    player1BuffsDisplay.innerHTML = '';
    player2BuffsDisplay.innerHTML = '';
}

// Update positions of game elements
function updateGameElements() {
    ball.style.left = ballX - ballSize / 2 + 'px';
    ball.style.top = ballY - ballSize / 2 + 'px';
    player1Paddle.style.top = player1PaddleY + 'px';
    player2Paddle.style.top = player2PaddleY + 'px';
    scoreDisplay.textContent = `${player1Score} : ${player2Score}`;
}

// Computer AI for paddle movement
function moveComputerPaddle(paddleY, targetY, speed) {
    const paddleHeight = parseInt(player1Paddle.style.height) || 100;
    const paddleCenter = paddleY + paddleHeight / 2;
    const ballCenter = targetY;
    
    if (paddleCenter < ballCenter - 10) {
        paddleY += speed;
    } else if (paddleCenter > ballCenter + 10) {
        paddleY -= speed;
    }
    
    // Keep paddle in bounds
    if (paddleY < 0) paddleY = 0;
    const maxHeight = gameHeight - paddleHeight;
    if (paddleY > maxHeight) paddleY = maxHeight;
    
    return paddleY;
}

// Calculate buff generation based on frequency level
function shouldGenerateBuff() {
    if (gameConfig.buffFrequency === 0) return false;
    
    // Check if we've completed enough rounds to consider generating buffs
    if (roundsCompleted - lastBuffCheckRound >= 10) {
        lastBuffCheckRound = roundsCompleted;
        
        // Reset counter and calculate how many buffs to generate based on level
        buffGenerationCounter = 0;
        return true;
    }
    
    return false;
}

// Generate random buff blocks based on frequency level
function generateBuffBlocks() {
    if (gameConfig.buffFrequency === 0) return;
    
    // Clear previous buff blocks
    Object.values(buffBlocks).forEach(block => {
        block.style.display = 'none';
    });
    
    // Calculate number of buffs to generate based on frequency level
    const buffsToGenerate = gameConfig.buffFrequency;
    
    // Create arrays for left and right side buffs
    const buffTypes = ['slow', 'split', 'color', 'enlarge', 'shrink'];
    
    // Generate buffs for left side
    for (let i = 0; i < buffsToGenerate; i++) {
        const randomType = buffTypes[Math.floor(Math.random() * buffTypes.length)];
        const blockId = `${randomType}1`;
        const block = buffBlocks[blockId];
        
        if (block) {
            block.style.display = 'block';
            block.style.left = '60px';
            block.style.top = Math.random() * (gameHeight - 20) + 'px';
        }
    }
    
    // Generate buffs for right side
    for (let i = 0; i < buffsToGenerate; i++) {
        const randomType = buffTypes[Math.floor(Math.random() * buffTypes.length)];
        const blockId = `${randomType}2`;
        const block = buffBlocks[blockId];
        
        if (block) {
            block.style.display = 'block';
            block.style.right = '60px';
            block.style.top = Math.random() * (gameHeight - 20) + 'px';
        }
    }
}

// Check collision between paddle and buff blocks
function checkBuffCollisions() {
    // Check left paddle collisions
    for (let i = 1; i <= 5; i++) {
        const buffKeys = ['slow', 'split', 'color', 'enlarge', 'shrink'];
        const buffKey = buffKeys[i-1];
        const block = buffBlocks[`${buffKey}1`];
        
        if (block && block.style.display !== 'none') {
            const blockRect = {
                x: parseInt(block.style.left),
                y: parseInt(block.style.top),
                width: 20,
                height: 20
            };
            
            const paddleHeight = parseInt(player1Paddle.style.height) || 100;
            const paddleRect = {
                x: paddleLeftX,
                y: player1PaddleY,
                width: paddleWidth,
                height: paddleHeight
            };
            
            if (checkCollision(paddleRect, blockRect)) {
                // Apply buff to player 1
                applyBuff(buffKey, 1);
                block.style.display = 'none';
            }
        }
    }
    
    // Check right paddle collisions
    for (let i = 1; i <= 5; i++) {
        const buffKeys = ['slow', 'split', 'color', 'enlarge', 'shrink'];
        const buffKey = buffKeys[i-1];
        const block = buffBlocks[`${buffKey}2`];
        
        if (block && block.style.display !== 'none') {
            const blockRect = {
                x: gameWidth - 60 - 20,
                y: parseInt(block.style.top),
                width: 20,
                height: 20
            };
            
            const paddleHeight = parseInt(player2Paddle.style.height) || 100;
            const paddleRect = {
                x: paddleRightX,
                y: player2PaddleY,
                width: paddleWidth,
                height: paddleHeight
            };
            
            if (checkCollision(paddleRect, blockRect)) {
                // Apply buff to player 2
                applyBuff(buffKey, 2);
                block.style.display = 'none';
            }
        }
    }
}

// Check if two rectangles collide
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Apply buff effect
function applyBuff(buffType, player) {
    const opponent = player === 1 ? 2 : 1;
    
    switch(buffType) {
        case 'slow':
            // Slow down ball by 20% for 3 rounds
            ballSpeedX *= 0.8;
            ballSpeedY *= 0.8;
            originalBallSpeedX *= 0.8;
            originalBallSpeedY *= 0.8;
            
            activeBuffs[`player${player}`].slow = {
                type: 'slow',
                duration: 3,
                originalSpeedX: originalBallSpeedX / 0.8,
                originalSpeedY: originalBallSpeedY / 0.8
            };
            updateBuffDisplay();
            break;
            
        case 'split':
            // Split ball into 3 copies
            createBallClones();
            activeBuffs[`player${player}`].split = {
                type: 'split',
                duration: Infinity
            };
            updateBuffDisplay();
            break;
            
        case 'color':
            // Change ball color randomly for 5 rounds
            changeBallColor();
            activeBuffs[`player${player}`].color = {
                type: 'color',
                duration: 5,
                originalColor: ball.style.backgroundColor
            };
            updateBuffDisplay();
            break;
            
        case 'enlarge':
            // Make player's paddle larger for 3 rounds
            const paddleElement = player === 1 ? player1Paddle : player2Paddle;
            const currentHeight = parseInt(paddleElement.style.height) || 100;
            const enlargedHeight = Math.min(currentHeight * gameConfig.paddleSizeRatio, gameConfig.paddleMaxLength);
            paddleElement.style.height = enlargedHeight + 'px';
            
            activeBuffs[`player${player}`].enlarge = {
                type: 'enlarge',
                duration: 3,
                originalHeight: currentHeight
            };
            updateBuffDisplay();
            break;
            
        case 'shrink':
            // Make opponent's paddle smaller for 3 rounds
            const opponentPaddle = opponent === 1 ? player1Paddle : player2Paddle;
            const oppCurrentHeight = parseInt(opponentPaddle.style.height) || 100;
            const shrunkHeight = Math.max(oppCurrentHeight / gameConfig.paddleSizeRatio, gameConfig.paddleMinLength);
            opponentPaddle.style.height = shrunkHeight + 'px';
            
            activeBuffs[`player${player}`].shrink = {
                type: 'shrink',
                target: opponent,
                duration: 3,
                originalHeight: oppCurrentHeight
            };
            updateBuffDisplay();
            break;
    }
}

// Create ball clones for split effect
function createBallClones() {
    clearBallClones();
    
    // Create 2 additional balls (total 3)
    for (let i = 0; i < 2; i++) {
        const clone = document.createElement('div');
        clone.className = 'ball-clone';
        clone.style.backgroundColor = getRandomColor();
        gameContainer.appendChild(clone);
        
        // Slightly different trajectories
        const angle = (i === 0) ? -0.5 : 0.5;
        ballClones.push({
            element: clone,
            x: ballX,
            y: ballY,
            speedX: ballSpeedX * (1 + angle * 0.3),
            speedY: ballSpeedY + angle * 3
        });
    }
}

// Clear all ball clones
function clearBallClones() {
    ballClones.forEach(clone => {
        if (clone.element && clone.element.parentNode) {
            clone.element.parentNode.removeChild(clone.element);
        }
    });
    ballClones = [];
}

// Get random color
function getRandomColor() {
    const colors = ['#ff5252', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0', '#ff9800', '#00bcd4'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Change ball color
function changeBallColor() {
    ball.style.backgroundColor = getRandomColor();
}

// Reset ball color
function resetBallColor() {
    ball.style.backgroundColor = '#fff';
}

// Update buff display
function updateBuffDisplay() {
    player1BuffsDisplay.innerHTML = '';
    player2BuffsDisplay.innerHTML = '';
    
    // Display player 1 buffs
    for (const [key, buff] of Object.entries(activeBuffs.player1)) {
        const buffElement = document.createElement('div');
        buffElement.textContent = `${getBuffName(key)} (${buff.duration === Infinity ? '∞' : buff.duration})`;
        player1BuffsDisplay.appendChild(buffElement);
    }
    
    // Display player 2 buffs
    for (const [key, buff] of Object.entries(activeBuffs.player2)) {
        const buffElement = document.createElement('div');
        buffElement.textContent = `${getBuffName(key)} (${buff.duration === Infinity ? '∞' : buff.duration})`;
        player2BuffsDisplay.appendChild(buffElement);
    }
}

// Get buff display name
function getBuffName(buffKey) {
    const names = {
        'slow': 'Slow',
        'split': 'Split',
        'color': 'Color',
        'enlarge': 'Big Paddle',
        'shrink': 'Small Opponent'
    };
    return names[buffKey] || buffKey;
}

// Update active buffs
function updateBuffs() {
    let needsUpdate = false;
    
    // Check if ball crossed the midline (increment rounds)
    const prevSide = ballCrossings % 2;
    const currentSide = ballX < gameWidth / 2 ? 0 : 1;
    
    if (prevSide !== currentSide) {
        ballCrossings++;
        if (ballCrossings % 2 === 0) {
            // Complete round (ball went to other side and back)
            roundsCompleted++;
            
            // Check if we should generate new buffs
            if (shouldGenerateBuff()) {
                generateBuffBlocks();
            }
            
            // Decrement buff durations
            for (const player of ['player1', 'player2']) {
                for (const [key, buff] of Object.entries(activeBuffs[player])) {
                    if (buff.duration !== Infinity) {
                        buff.duration--;
                        if (buff.duration <= 0) {
                            removeBuff(player, key, buff);
                            delete activeBuffs[player][key];
                            needsUpdate = true;
                        }
                    }
                }
            }
        }
    }
    
    if (needsUpdate) {
        updateBuffDisplay();
    }
}

// Remove buff effect
function removeBuff(player, buffKey, buff) {
    switch(buffKey) {
        case 'slow':
            // Restore original speed
            if (buff.originalSpeedX) {
                originalBallSpeedX = buff.originalSpeedX;
                originalBallSpeedY = buff.originalSpeedY;
                // Only update current speed if no other slow buff is active
                let hasOtherSlow = false;
                for (const p of ['player1', 'player2']) {
                    if (activeBuffs[p].slow && activeBuffs[p].slow !== buff) {
                        hasOtherSlow = true;
                        break;
                    }
                }
                if (!hasOtherSlow) {
                    ballSpeedX = Math.sign(ballSpeedX) * originalBallSpeedX;
                    ballSpeedY = Math.sign(ballSpeedY) * originalBallSpeedY;
                }
            }
            break;
            
        case 'color':
            // Restore original color
            resetBallColor();
            break;
            
        case 'enlarge':
            // Restore original paddle size
            const paddle = player === 'player1' ? player1Paddle : player2Paddle;
            paddle.style.height = buff.originalHeight + 'px';
            break;
            
        case 'shrink':
            // Restore opponent's paddle size
            const opponent = buff.target;
            const opponentPaddle = opponent === 1 ? player1Paddle : player2Paddle;
            opponentPaddle.style.height = buff.originalHeight + 'px';
            break;
    }
}

// Update ball clones
function updateBallClones() {
    for (let i = 0; i < ballClones.length; i++) {
        const clone = ballClones[i];
        clone.x += clone.speedX;
        clone.y += clone.speedY;
        
        // Wall collisions
        if (clone.y <= ballSize / 2 || clone.y >= gameHeight - ballSize / 2) {
            clone.speedY = -clone.speedY;
            clone.y = clone.y <= ballSize / 2 ? ballSize / 2 : gameHeight - ballSize / 2;
        }
        
        // Remove ball clones when they go outside the play area (with buffer)
        if (clone.x < -50 || clone.x > gameWidth + 50) {
            if (clone.element && clone.element.parentNode) {
                clone.element.parentNode.removeChild(clone.element);
            }
            ballClones.splice(i, 1);
            i--;
            continue;
        }
        
        // Scoring for ball clones
        if (clone.x < 0) {
            player2Score++;
            // Remove the ball clone immediately
            if (clone.element && clone.element.parentNode) {
                clone.element.parentNode.removeChild(clone.element);
            }
            ballClones.splice(i, 1);
            i--;
            continue;
        } else if (clone.x > gameWidth) {
            player1Score++;
            // Remove the ball clone immediately
            if (clone.element && clone.element.parentNode) {
                clone.element.parentNode.removeChild(clone.element);
            }
            ballClones.splice(i, 1);
            i--;
            continue;
        }
        
        // Paddle collisions
        // Left paddle
        const player1PaddleHeight = parseInt(player1Paddle.style.height) || 100;
        if (clone.x - ballSize / 2 <= paddleLeftX + paddleWidth && 
            clone.x - ballSize / 2 >= paddleLeftX &&
            clone.y + ballSize / 2 >= player1PaddleY && 
            clone.y - ballSize / 2 <= player1PaddleY + player1PaddleHeight) {
            clone.speedX = Math.abs(clone.speedX);
        }
        
        // Right paddle
        const player2PaddleHeight = parseInt(player2Paddle.style.height) || 100;
        if (clone.x + ballSize / 2 >= paddleRightX && 
            clone.x + ballSize / 2 <= paddleRightX + paddleWidth &&
            clone.y + ballSize / 2 >= player2PaddleY && 
            clone.y - ballSize / 2 <= player2PaddleY + player2PaddleHeight) {
            clone.speedX = -Math.abs(clone.speedX);
        }
        
        // Update position
        if (clone.element) {
            clone.element.style.left = clone.x - ballSize / 2 + 'px';
            clone.element.style.top = clone.y - ballSize / 2 + 'px';
        }
    }
}

// Check score for split balls
function checkScore() {
    // If split buff is active, game continues until all balls are scored
    let hasSplitBuff = false;
    for (const player of ['player1', 'player2']) {
        if (activeBuffs[player].split) {
            hasSplitBuff = true;
            break;
        }
    }
    
    if (!hasSplitBuff && ballClones.length === 0) {
        resetBall();
    }
}

// Reset ball after scoring (when no split balls)
function resetBall() {
    ballX = gameWidth / 2;
    ballY = gameHeight / 2;
    ballSpeedX = Math.sign(ballSpeedX) * gameConfig.ballBaseSpeed;
    ballSpeedY = (Math.random() * 6 - 3);
    
    // Ensure ball speed is within limits
    if (Math.abs(ballSpeedX) < gameConfig.ballMinSpeed) {
        ballSpeedX = Math.sign(ballSpeedX) * gameConfig.ballMinSpeed;
    }
    if (Math.abs(ballSpeedX) > gameConfig.ballMaxSpeed) {
        ballSpeedX = Math.sign(ballSpeedX) * gameConfig.ballMaxSpeed;
    }
    
    if (Math.abs(ballSpeedY) < gameConfig.ballMinSpeed) {
        ballSpeedY = Math.sign(ballSpeedY) * gameConfig.ballMinSpeed;
    }
    if (Math.abs(ballSpeedY) > gameConfig.ballMaxSpeed) {
        ballSpeedY = Math.sign(ballSpeedY) * gameConfig.ballMaxSpeed;
    }
    
    originalBallSpeedX = Math.abs(ballSpeedX);
    originalBallSpeedY = Math.abs(ballSpeedY);
}

// Game loop
function gameLoop() {
    if (!isGameRunning || isGamePaused) {
        if (isGameRunning && isGamePaused) {
            animationId = requestAnimationFrame(gameLoop);
        }
        return;
    }
    
    // Move the ball
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    
    // Ball collision with top and bottom walls
    if (ballY <= ballSize / 2 || ballY >= gameHeight - ballSize / 2) {
        ballSpeedY = -ballSpeedY;
        ballY = ballY <= ballSize / 2 ? ballSize / 2 : gameHeight - ballSize / 2;
    }
    
    // Left player (Player 1) paddle movement
    const player1PaddleHeight = parseInt(player1Paddle.style.height) || 100;
    if (leftPlayerMode === 'human') {
        if (wPressed && player1PaddleY > 0) {
            player1PaddleY -= 7;
        }
        if (sPressed && player1PaddleY < gameHeight - player1PaddleHeight) {
            player1PaddleY += 7;
        }
    } else {
        // PC mode for left player
        const computerSpeed = Math.abs(ballSpeedX) * 0.6;
        player1PaddleY = moveComputerPaddle(player1PaddleY, ballY, computerSpeed);
    }
    
    // Right player (Player 2) paddle movement
    const player2PaddleHeight = parseInt(player2Paddle.style.height) || 100;
    if (rightPlayerMode === 'human') {
        if (upPressed && player2PaddleY > 0) {
            player2PaddleY -= 7;
        }
        if (downPressed && player2PaddleY < gameHeight - player2PaddleHeight) {
            player2PaddleY += 7;
        }
    } else {
        // PC mode for right player
        const computerSpeed = Math.abs(ballSpeedX) * 0.6;
        player2PaddleY = moveComputerPaddle(player2PaddleY, ballY, computerSpeed);
    }
    
    // Ball collision with paddles
    // Left paddle (Player 1)
    if (ballX - ballSize / 2 <= paddleLeftX + paddleWidth && 
        ballX - ballSize / 2 >= paddleLeftX &&
        ballY + ballSize / 2 >= player1PaddleY && 
        ballY - ballSize / 2 <= player1PaddleY + player1PaddleHeight && 
        ballSpeedX < 0) {
        ballSpeedX = Math.abs(ballSpeedX);
        
        // Add angle based on where ball hits paddle
        const hitPosition = (ballY - player1PaddleY) / player1PaddleHeight;
        ballSpeedY = 10 * (hitPosition - 0.5); // Range from -5 to 5
        
        // Increase speed based on config
        ballSpeedX *= gameConfig.ballSpeedRatio;
        ballSpeedY *= gameConfig.ballSpeedRatio;
        
        // Ensure ball speed stays within limits
        if (Math.abs(ballSpeedX) > gameConfig.ballMaxSpeed) {
            ballSpeedX = Math.sign(ballSpeedX) * gameConfig.ballMaxSpeed;
        }
        if (Math.abs(ballSpeedY) > gameConfig.ballMaxSpeed) {
            ballSpeedY = Math.sign(ballSpeedY) * gameConfig.ballMaxSpeed;
        }
        
        originalBallSpeedX = Math.abs(ballSpeedX);
        originalBallSpeedY = Math.abs(ballSpeedY);
    }
    
    // Right paddle (Player 2)
    if (ballX + ballSize / 2 >= paddleRightX && 
        ballX + ballSize / 2 <= paddleRightX + paddleWidth &&
        ballY + ballSize / 2 >= player2PaddleY && 
        ballY - ballSize / 2 <= player2PaddleY + player2PaddleHeight && 
        ballSpeedX > 0) {
        ballSpeedX = -Math.abs(ballSpeedX);
        
        // Add angle based on where ball hits paddle
        const hitPosition = (ballY - player2PaddleY) / player2PaddleHeight;
        ballSpeedY = 10 * (hitPosition - 0.5); // Range from -5 to 5
        
        // Increase speed based on config
        ballSpeedX *= gameConfig.ballSpeedRatio;
        ballSpeedY *= gameConfig.ballSpeedRatio;
        
        // Ensure ball speed stays within limits
        if (Math.abs(ballSpeedX) > gameConfig.ballMaxSpeed) {
            ballSpeedX = Math.sign(ballSpeedX) * gameConfig.ballMaxSpeed;
        }
        if (Math.abs(ballSpeedY) > gameConfig.ballMaxSpeed) {
            ballSpeedY = Math.sign(ballSpeedY) * gameConfig.ballMaxSpeed;
        }
        
        originalBallSpeedX = Math.abs(ballSpeedX);
        originalBallSpeedY = Math.abs(ballSpeedY);
    }
    
    // Score points
    if (ballX < 0) {
        player2Score++;
        if (ballClones.length === 0) {
            resetBall();
        }
    } else if (ballX > gameWidth) {
        player1Score++;
        if (ballClones.length === 0) {
            resetBall();
        }
    }
    
    // Check for buff collisions
    checkBuffCollisions();
    
    // Update active buffs
    updateBuffs();
    
    // Update ball clones
    updateBallClones();
    
    // Update visual elements
    updateGameElements();
    
    // Continue game loop
    animationId = requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    isGameRunning = true;
    isGamePaused = false;
    startScreen.style.display = 'none';
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    restartBtn.disabled = false;
    
    // Generate initial buff blocks if enabled
    if (gameConfig.buffFrequency > 0) {
        setTimeout(() => {
            if (isGameRunning && !isGamePaused) {
                generateBuffBlocks();
            }
        }, 1000);
    }
    
    if (!animationId) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

// Pause game
function pauseGame() {
    isGamePaused = !isGamePaused;
    pauseBtn.textContent = isGamePaused ? "Resume" : "Pause";
}

// Restart game
function restartGame() {
    player1Score = 0;
    player2Score = 0;
    isGamePaused = false;
    pauseBtn.textContent = "Pause";
    initGame();
    
    // Clear all active buffs
    activeBuffs = {
        player1: {},
        player2: {}
    };
    updateBuffDisplay();
    
    if (!isGameRunning) {
        startGame();
    }
}

// Open settings
function openSettings() {
    // Pause game if running
    if (isGameRunning && !isGamePaused) {
        isGamePaused = true;
        pauseBtn.textContent = "Resume";
    }
    
    // Populate settings with current values
    buffFrequencySlider.value = gameConfig.buffFrequency;
    buffFrequencyValue.textContent = gameConfig.buffFrequency;
    ballBaseSpeedInput.value = gameConfig.ballBaseSpeed;
    ballMinSpeedInput.value = gameConfig.ballMinSpeed;
    ballMaxSpeedInput.value = gameConfig.ballMaxSpeed;
    ballSpeedRatioInput.value = gameConfig.ballSpeedRatio;
    paddleMinLengthInput.value = gameConfig.paddleMinLength;
    paddleMaxLengthInput.value = gameConfig.paddleMaxLength;
    paddleSizeRatioInput.value = gameConfig.paddleSizeRatio;
    
    // Show settings panel
    settingsPanel.style.display = 'flex';
}

// Save settings
function saveSettings() {
    // Validate and save settings
    gameConfig.buffFrequency = parseInt(buffFrequencySlider.value);
    gameConfig.ballBaseSpeed = Math.max(1, Math.min(15, parseFloat(ballBaseSpeedInput.value)));
    gameConfig.ballMinSpeed = Math.max(1, Math.min(10, parseFloat(ballMinSpeedInput.value)));
    gameConfig.ballMaxSpeed = Math.max(5, Math.min(20, parseFloat(ballMaxSpeedInput.value)));
    gameConfig.ballSpeedRatio = Math.max(1.1, Math.min(1.5, parseFloat(ballSpeedRatioInput.value)));
    gameConfig.paddleMinLength = Math.max(30, Math.min(100, parseInt(paddleMinLengthInput.value)));
    gameConfig.paddleMaxLength = Math.max(100, Math.min(200, parseInt(paddleMaxLengthInput.value)));
    gameConfig.paddleSizeRatio = Math.max(1.1, Math.min(1.5, parseFloat(paddleSizeRatioInput.value)));
    
    // Ensure min speed is not greater than max speed
    if (gameConfig.ballMinSpeed > gameConfig.ballMaxSpeed) {
        gameConfig.ballMinSpeed = gameConfig.ballMaxSpeed - 2;
        if (gameConfig.ballMinSpeed < 1) gameConfig.ballMinSpeed = 1;
        ballMinSpeedInput.value = gameConfig.ballMinSpeed;
    }
    
    // Ensure min length is not greater than max length
    if (gameConfig.paddleMinLength > gameConfig.paddleMaxLength) {
        gameConfig.paddleMinLength = gameConfig.paddleMaxLength - 30;
        if (gameConfig.paddleMinLength < 30) gameConfig.paddleMinLength = 30;
        paddleMinLengthInput.value = gameConfig.paddleMinLength;
    }
    
    // Hide settings panel
    settingsPanel.style.display = 'none';
    
    // If game is running, reset with new settings
    if (isGameRunning) {
        initGame();
    }
}

// Cancel settings
function cancelSettings() {
    settingsPanel.style.display = 'none';
}

// Event listeners for game control buttons
startButton.addEventListener('click', startGame);
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
restartBtn.addEventListener('click', restartGame);
settingsBtn.addEventListener('click', openSettings);
saveSettingsBtn.addEventListener('click', saveSettings);
cancelSettingsBtn.addEventListener('click', cancelSettings);

// Update slider value display
buffFrequencySlider.addEventListener('input', function() {
    buffFrequencyValue.textContent = this.value;
});

// Mode toggle buttons
leftHumanBtn.addEventListener('click', function() {
    leftPlayerMode = 'human';
    leftHumanBtn.classList.add('active');
    leftPCBtn.classList.remove('active');
});

leftPCBtn.addEventListener('click', function() {
    leftPlayerMode = 'pc';
    leftPCBtn.classList.add('active');
    leftHumanBtn.classList.remove('active');
});

rightHumanBtn.addEventListener('click', function() {
    rightPlayerMode = 'human';
    rightHumanBtn.classList.add('active');
    rightPCBtn.classList.remove('active');
});

rightPCBtn.addEventListener('click', function() {
    rightPlayerMode = 'pc';
    rightPCBtn.classList.add('active');
    rightHumanBtn.classList.remove('active');
});

// Keyboard controls
document.addEventListener('keydown', function(e) {
    switch(e.key) {
        case 'w':
        case 'W':
            wPressed = true;
            break;
        case 's':
        case 'S':
            sPressed = true;
            break;
        case 'ArrowUp':
            upPressed = true;
            break;
        case 'ArrowDown':
            downPressed = true;
            break;
        case ' ':
            if (isGameRunning) {
                pauseGame();
            }
            break;
        case 'Escape':
            if (settingsPanel.style.display === 'flex') {
                cancelSettings();
            }
            break;
    }
});

document.addEventListener('keyup', function(e) {
    switch(e.key) {
        case 'w':
        case 'W':
            wPressed = false;
            break;
        case 's':
        case 'S':
            sPressed = false;
            break;
        case 'ArrowUp':
            upPressed = false;
            break;
        case 'ArrowDown':
            downPressed = false;
            break;
    }
});

// Initialize game
initUI();
initGame();
