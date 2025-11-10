const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 15;
const PADDLE_SPEED = 8;
const INITIAL_BALL_SPEED = 7;
const SPEED_INCREMENT = 0.008;

let gameStarted = false;
let gamePaused = false;
let scoreMessage = '';
let scoreMessageTime = 0;
let aiMode = false;
let gameOver = false;
let winner = '';
let aiDifficulty = 'medium';
const WINNING_SCORE = 5;

// Control settings
let player1Controls = {
  up: 'w',
  down: 's',
};
let player2Controls = {
  up: 'ArrowUp',
  down: 'ArrowDown',
};

// Statistics
let stats = {
  currentRally: 0,
  longestRally: 0,
  totalHits: 0,
  gamesPlayed: 0,
};

// Particles array
const particles = [];

// Sound effects (Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playHitSound() {
  playSound(400, 0.1, 'square');
}

function playWallSound() {
  playSound(200, 0.1, 'sine');
}

function playScoreSound() {
  playSound(600, 0.2, 'triangle');
  setTimeout(() => playSound(500, 0.2, 'triangle'), 100);
}

function playWinSound() {
  playSound(523, 0.15, 'sine');
  setTimeout(() => playSound(659, 0.15, 'sine'), 150);
  setTimeout(() => playSound(784, 0.3, 'sine'), 300);
}

// Particle system
class Particle {
  constructor(x, y, vx, vy, color, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = Math.random() * 4 + 2;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // gravity
    this.life--;
  }
  
  draw() {
    const alpha = this.life / this.maxLife;
    ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function createExplosion(x, y, color, count = 20) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = Math.random() * 3 + 2;
    particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      color,
      60
    ));
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  particles.forEach(p => p.draw());
}

// Ball trail effect
const ballTrail = [];
function updateBallTrail() {
  ballTrail.push({ x: ball.x, y: ball.y });
  if (ballTrail.length > 8) ballTrail.shift();
}

function drawBallTrail() {
  for (let i = 0; i < ballTrail.length; i++) {
    const alpha = (i / ballTrail.length) * 0.3;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(ballTrail[i].x, ballTrail[i].y, ball.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

const player1 = {
  x: 30,
  y: canvas.height / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  score: 0,
  dy: 0,
  hitFlash: 0,
};

const player2 = {
  x: canvas.width - 30 - PADDLE_WIDTH,
  y: canvas.height / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  score: 0,
  dy: 0,
  hitFlash: 0,
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: BALL_SIZE,
  dx: INITIAL_BALL_SPEED,
  dy: INITIAL_BALL_SPEED,
  speed: INITIAL_BALL_SPEED,
};

const keys = {};

// AI Difficulty settings
const AI_SETTINGS = {
  easy: { speed: 0.7, reactionDelay: 8, errorMargin: 25 },
  medium: { speed: 0.85, reactionDelay: 5, errorMargin: 15 },
  hard: { speed: 1.1, reactionDelay: 2, errorMargin: 5 },
};

// Settings modal
document.getElementById('settingsBtn').addEventListener('click', () => {
  document.getElementById('settingsModal').style.display = 'flex';
});

document.getElementById('closeSettings').addEventListener('click', () => {
  document.getElementById('settingsModal').style.display = 'none';
});

document.getElementById('p1ControlWS').addEventListener('click', () => {
  player1Controls = { up: 'w', down: 's' };
  updateControlButtons();
  updateControlsText();
});

document.getElementById('p1ControlArrows').addEventListener('click', () => {
  player1Controls = { up: 'ArrowUp', down: 'ArrowDown' };
  updateControlButtons();
  updateControlsText();
});

document.getElementById('p2ControlWS').addEventListener('click', () => {
  player2Controls = { up: 'w', down: 's' };
  updateControlButtons();
  updateControlsText();
});

document.getElementById('p2ControlArrows').addEventListener('click', () => {
  player2Controls = { up: 'ArrowUp', down: 'ArrowDown' };
  updateControlButtons();
  updateControlsText();
});

function updateControlButtons() {
  // Player 1
  document.getElementById('p1ControlWS').classList.toggle('active', 
    player1Controls.up === 'w');
  document.getElementById('p1ControlArrows').classList.toggle('active', 
    player1Controls.up === 'ArrowUp');
  
  // Player 2
  document.getElementById('p2ControlWS').classList.toggle('active', 
    player2Controls.up === 'w');
  document.getElementById('p2ControlArrows').classList.toggle('active', 
    player2Controls.up === 'ArrowUp');
}

function updateControlsText() {
  const p1Text = player1Controls.up === 'w' ? 'W/S' : '↑/↓';
  const p2Text = player2Controls.up === 'w' ? 'W/S' : '↑/↓';
  
  if (aiMode) {
    document.getElementById('controlsText').textContent = `Use ${p1Text} keys to move`;
  } else {
    document.getElementById('controlsText').textContent = 
      `Player 1: ${p1Text} keys | Player 2: ${p2Text} keys`;
  }
}

// Mode selection
document.getElementById('pvpBtn').addEventListener('click', () => {
  aiMode = false;
  document.getElementById('modeSelect').style.display = 'none';
  document.getElementById('difficultySelect').style.display = 'none';
  startGame();
});

document.getElementById('aiBtn').addEventListener('click', () => {
  aiMode = true;
  document.getElementById('modeSelect').style.display = 'none';
  document.getElementById('difficultySelect').style.display = 'block';
});

// Difficulty selection
document.querySelectorAll('.difficulty-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    aiDifficulty = e.target.dataset.difficulty;
    document.getElementById('difficultySelect').style.display = 'none';
    updateControlsText();
    startGame();
  });
});

function startGame() {
  document.getElementById('gameContainer').style.display = 'block';
  updateControlsText();
  audioContext.resume(); // Start audio context
}

// Mobile menu button
document.getElementById('mobileMenuBtn').addEventListener('click', () => {
  returnToMainMenu();
});

function resetGame() {
  player1.score = 0;
  player2.score = 0;
  gameOver = false;
  winner = '';
  gameStarted = false;
  stats.currentRally = 0;
  stats.longestRally = 0;
  stats.totalHits = 0;
  resetBall(1);
}

function returnToMainMenu() {
  player1.score = 0;
  player2.score = 0;
  gameOver = false;
  winner = '';
  gameStarted = false;
  gamePaused = false;
  scoreMessage = '';
  scoreMessageTime = 0;
  stats.currentRally = 0;
  resetBall(1);
  document.getElementById('gameContainer').style.display = 'none';
  document.getElementById('modeSelect').style.display = 'block';
}

document.addEventListener('keydown', (e) => {
  keys[e.key] = true;

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }

  if (e.key === ' ') {
    if (gameOver) {
      resetGame();
    } else if (!gameStarted) {
      gameStarted = true;
      gamePaused = false;
    } else {
      gamePaused = !gamePaused;
    }
  }

  if (e.key === 'Escape') {
    returnToMainMenu();
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
  
  // Extra safety: clear all possible key variations
  if (e.key.length === 1) {
    keys[e.key.toLowerCase()] = false;
    keys[e.key.toUpperCase()] = false;
  }
});

// Touch controls for mobile - Multi-touch support
const activeTouches = new Map(); // Track multiple touches

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  
  // Start game if not started
  if (!gameStarted && !gameOver) {
    gameStarted = true;
    gamePaused = false;
    audioContext.resume();
  }
  
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  // Handle all touches
  for (let i = 0; i < e.touches.length; i++) {
    const touch = e.touches[i];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    
    // Determine which paddle based on touch position
    let paddle;
    if (aiMode) {
      paddle = player1; // Only control player 1 in AI mode
    } else {
      paddle = x < canvas.width / 2 ? player1 : player2;
    }
    
    // Store this touch with its paddle
    activeTouches.set(touch.identifier, { paddle, initialY: y });
  }
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!gameStarted || gamePaused || gameOver) return;
  
  const rect = canvas.getBoundingClientRect();
  const scaleY = canvas.height / rect.height;
  
  // Update all active touches
  for (let i = 0; i < e.touches.length; i++) {
    const touch = e.touches[i];
    const touchData = activeTouches.get(touch.identifier);
    
    if (touchData) {
      const y = (touch.clientY - rect.top) * scaleY;
      const targetY = y - touchData.paddle.height / 2;
      touchData.paddle.y = targetY;
      
      // Boundary checks
      if (touchData.paddle.y < 0) touchData.paddle.y = 0;
      if (touchData.paddle.y + touchData.paddle.height > canvas.height) {
        touchData.paddle.y = canvas.height - touchData.paddle.height;
      }
    }
  }
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  
  // Remove ended touches
  const currentTouches = new Set();
  for (let i = 0; i < e.touches.length; i++) {
    currentTouches.add(e.touches[i].identifier);
  }
  
  // Clear touches that ended
  for (const [id] of activeTouches) {
    if (!currentTouches.has(id)) {
      activeTouches.delete(id);
    }
  }
});

canvas.addEventListener('touchcancel', (e) => {
  e.preventDefault();
  activeTouches.clear();
});

function updatePaddles() {
  if (gamePaused || !gameStarted || gameOver) {
    player1.dy = 0;
    player2.dy = 0;
    return;
  }
  
  // Check if paddle is being touch controlled
  const p1TouchControlled = Array.from(activeTouches.values()).some(t => t.paddle === player1);
  const p2TouchControlled = Array.from(activeTouches.values()).some(t => t.paddle === player2);
  
  // Player 1 controls (dynamic based on settings)
  const p1Up = keys[player1Controls.up] || keys[player1Controls.up.toLowerCase()] || keys[player1Controls.up.toUpperCase()];
  const p1Down = keys[player1Controls.down] || keys[player1Controls.down.toLowerCase()] || keys[player1Controls.down.toUpperCase()];
  
  if (!p1TouchControlled) {
    if (p1Up && !p1Down) {
      player1.dy = -PADDLE_SPEED;
    } else if (p1Down && !p1Up) {
      player1.dy = PADDLE_SPEED;
    } else {
      player1.dy = 0;
    }
  }

  // Player 2 controls (Arrow Up/Down or AI)
  if (aiMode) {
    const settings = AI_SETTINGS[aiDifficulty];
    const paddleCenter = player2.y + player2.height / 2;
    const targetY = ball.y + (Math.random() - 0.5) * settings.errorMargin;
    const diff = targetY - paddleCenter;
    const aiSpeed = PADDLE_SPEED * settings.speed;
    
    if (Math.abs(diff) > settings.errorMargin) {
      if (diff > 0) {
        player2.dy = aiSpeed;
      } else {
        player2.dy = -aiSpeed;
      }
    } else {
      player2.dy = 0;
    }
  } else {
    const p2Up = keys[player2Controls.up] || keys[player2Controls.up.toLowerCase()] || keys[player2Controls.up.toUpperCase()];
    const p2Down = keys[player2Controls.down] || keys[player2Controls.down.toLowerCase()] || keys[player2Controls.down.toUpperCase()];
    
    if (!p2TouchControlled) {
      if (p2Up && !p2Down) {
        player2.dy = -PADDLE_SPEED;
      } else if (p2Down && !p2Up) {
        player2.dy = PADDLE_SPEED;
      } else {
        player2.dy = 0;
      }
    }
  }

  // Update positions (only if not touch controlled)
  if (!p1TouchControlled) player1.y += player1.dy;
  if (!p2TouchControlled) player2.y += player2.dy;

  // Boundary checks with safety stop
  if (player1.y < 0) {
    player1.y = 0;
    player1.dy = 0; // Stop at boundary
  }
  if (player1.y + player1.height > canvas.height) {
    player1.y = canvas.height - player1.height;
    player1.dy = 0; // Stop at boundary
  }
  if (player2.y < 0) {
    player2.y = 0;
    player2.dy = 0; // Stop at boundary
  }
  if (player2.y + player2.height > canvas.height) {
    player2.y = canvas.height - player2.height;
    player2.dy = 0; // Stop at boundary
  }
  
  // Decay hit flash
  if (player1.hitFlash > 0) player1.hitFlash--;
  if (player2.hitFlash > 0) player2.hitFlash--;
}

function updateBall() {
  if (!gameStarted || gamePaused || scoreMessageTime > 0 || gameOver) return;

  // Gradually increase ball speed over time
  ball.speed += SPEED_INCREMENT;
  const speedRatio = ball.speed / Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
  ball.dx *= speedRatio;
  ball.dy *= speedRatio;

  ball.x += ball.dx;
  ball.y += ball.dy;
  
  updateBallTrail();

  // Top and bottom collision
  if (ball.y - ball.size / 2 < 0) {
    ball.y = ball.size / 2;
    ball.dy = Math.abs(ball.dy);
    playWallSound();
    createExplosion(ball.x, ball.y, 'rgb(100, 200, 255)', 10);
  }
  if (ball.y + ball.size / 2 > canvas.height) {
    ball.y = canvas.height - ball.size / 2;
    ball.dy = -Math.abs(ball.dy);
    playWallSound();
    createExplosion(ball.x, ball.y, 'rgb(100, 200, 255)', 10);
  }

  // Paddle collision - Player 1
  if (
    ball.x - ball.size / 2 < player1.x + player1.width &&
    ball.x + ball.size / 2 > player1.x &&
    ball.y > player1.y &&
    ball.y < player1.y + player1.height
  ) {
    // Calculate angle based on where ball hits paddle
    const hitPos = (ball.y - (player1.y + player1.height / 2)) / (player1.height / 2);
    const angle = hitPos * (Math.PI / 4); // Max 45 degrees
    
    // Set velocity to maintain current speed
    ball.dx = Math.abs(ball.speed * Math.cos(angle));
    ball.dy = ball.speed * Math.sin(angle);
    
    playHitSound();
    player1.hitFlash = 10;
    createExplosion(ball.x, ball.y, 'rgb(255, 107, 53)', 15);
    stats.currentRally++;
    stats.totalHits++;
  }

  // Paddle collision - Player 2
  if (
    ball.x + ball.size / 2 > player2.x &&
    ball.x - ball.size / 2 < player2.x + player2.width &&
    ball.y > player2.y &&
    ball.y < player2.y + player2.height
  ) {
    // Calculate angle based on where ball hits paddle
    const hitPos = (ball.y - (player2.y + player2.height / 2)) / (player2.height / 2);
    const angle = hitPos * (Math.PI / 4); // Max 45 degrees
    
    // Set velocity to maintain current speed
    ball.dx = -Math.abs(ball.speed * Math.cos(angle));
    ball.dy = ball.speed * Math.sin(angle);
    
    playHitSound();
    player2.hitFlash = 10;
    createExplosion(ball.x, ball.y, 'rgb(0, 217, 255)', 15);
    stats.currentRally++;
    stats.totalHits++;
  }

  // Score - Player 1 wins point
  if (ball.x + ball.size / 2 > canvas.width) {
    if (stats.currentRally > stats.longestRally) {
      stats.longestRally = stats.currentRally;
    }
    stats.currentRally = 0;
    
    player1.score++;
    
    if (player1.score >= WINNING_SCORE) {
      gameOver = true;
      gameStarted = false;
      winner = aiMode ? 'You Win!' : 'Player 1 Wins!';
      stats.gamesPlayed++;
      playWinSound();
      createExplosion(canvas.width / 2, canvas.height / 2, 'rgb(255, 215, 0)', 50);
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.dx = 0;
      ball.dy = 0;
    } else {
      scoreMessage = aiMode ? 'You Score!' : 'Player 1 Scores!';
      scoreMessageTime = 120;
      playScoreSound();
      createExplosion(canvas.width - 50, canvas.height / 2, 'rgb(255, 107, 53)', 30);
      resetBall(-1);
    }
  }

  // Score - Player 2 wins point
  if (ball.x - ball.size / 2 < 0) {
    if (stats.currentRally > stats.longestRally) {
      stats.longestRally = stats.currentRally;
    }
    stats.currentRally = 0;
    
    player2.score++;
    
    if (player2.score >= WINNING_SCORE) {
      gameOver = true;
      gameStarted = false;
      winner = aiMode ? 'AI Wins!' : 'Player 2 Wins!';
      stats.gamesPlayed++;
      playWinSound();
      createExplosion(canvas.width / 2, canvas.height / 2, 'rgb(255, 215, 0)', 50);
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.dx = 0;
      ball.dy = 0;
    } else {
      scoreMessage = aiMode ? 'AI Scores!' : 'Player 2 Scores!';
      scoreMessageTime = 120;
      playScoreSound();
      createExplosion(50, canvas.height / 2, 'rgb(0, 217, 255)', 30);
      resetBall(1);
    }
  }
}

function resetBall(direction) {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.speed = INITIAL_BALL_SPEED;
  ball.dx = direction * INITIAL_BALL_SPEED;
  ball.dy = (Math.random() - 0.5) * INITIAL_BALL_SPEED;
  ballTrail.length = 0;
}

function draw() {
  // Clear canvas
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw center line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 4;
  ctx.setLineDash([20, 15]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw score on canvas
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(player1.score, canvas.width / 4, 80);
  ctx.fillText(player2.score, (canvas.width * 3) / 4, 80);
  
  // Draw stats
  if (gameStarted && !gameOver) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Rally: ${stats.currentRally}`, 10, canvas.height - 40);
    ctx.fillText(`Longest: ${stats.longestRally}`, 10, canvas.height - 20);
    ctx.textAlign = 'right';
    ctx.fillText(`Total Hits: ${stats.totalHits}`, canvas.width - 10, canvas.height - 20);
  }

  // Draw ball trail
  drawBallTrail();

  // Draw paddles with hit flash
  const p1Color = player1.hitFlash > 0 ? '#ffff00' : '#ff6b35';
  const p2Color = player2.hitFlash > 0 ? '#ffff00' : '#00d9ff';
  
  ctx.fillStyle = p1Color;
  ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
  ctx.fillStyle = p2Color;
  ctx.fillRect(player2.x, player2.y, player2.width, player2.height);

  // Draw ball with glow
  const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.size);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw particles
  drawParticles();

  // Draw "Press SPACE to start" or "Touch to start" message
  if (!gameStarted && !gameOver) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    
    // Detect if device is touch-capable
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const message = isTouchDevice ? 'Touch to start' : 'Press SPACE to start';
    
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 50);
  }

  // Draw score message
  if (scoreMessageTime > 0 && !gameOver) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(scoreMessage, canvas.width / 2, canvas.height / 2);
  }

  // Draw game over screen
  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(winner, canvas.width / 2, canvas.height / 2 - 80);
    
    ctx.font = '30px Arial';
    ctx.fillText(
      `Final Score: ${player1.score} - ${player2.score}`,
      canvas.width / 2,
      canvas.height / 2 - 20
    );
    
    // Draw final stats
    ctx.font = '20px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`Longest Rally: ${stats.longestRally}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText(`Total Hits: ${stats.totalHits}`, canvas.width / 2, canvas.height / 2 + 50);
    
    ctx.font = '24px Arial';
    ctx.fillText('Press SPACE to play again', canvas.width / 2, canvas.height / 2 + 100);
  }

  // Draw "PAUSED" message
  if (gamePaused && !gameOver) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, 80);
  }
}

function gameLoop() {
  updatePaddles();
  updateBall();
  updateParticles();
  
  // Countdown score message timer
  if (scoreMessageTime > 0) {
    scoreMessageTime--;
  }
  
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
