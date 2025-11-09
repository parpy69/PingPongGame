const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 15;
const PADDLE_SPEED = 6;
const INITIAL_BALL_SPEED = 5;
const SPEED_INCREMENT = 0.003;

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
});

// Touch controls for mobile
let touchStartY = 0;
let touchPaddle = null;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  touchStartY = y;
  
  // Determine which paddle to control based on touch position
  if (x < canvas.width / 2) {
    touchPaddle = player1;
  } else {
    touchPaddle = player2;
  }
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!touchPaddle) return;
  
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const y = touch.clientY - rect.top;
  
  touchPaddle.y = y - touchPaddle.height / 2;
  
  // Boundary checks
  if (touchPaddle.y < 0) touchPaddle.y = 0;
  if (touchPaddle.y + touchPaddle.height > canvas.height) {
    touchPaddle.y = canvas.height - touchPaddle.height;
  }
});

canvas.addEventListener('touchend', () => {
  touchPaddle = null;
});

function updatePaddles() {
  if (gamePaused || !gameStarted || gameOver) return;
  
  // Player 1 controls (dynamic based on settings)
  const p1UpKey = player1Controls.up.toLowerCase();
  const p1DownKey = player1Controls.down.toLowerCase();
  
  if (keys[p1UpKey] || keys[p1UpKey.toUpperCase()] || keys[player1Controls.up]) {
    player1.dy = -PADDLE_SPEED;
  } else if (keys[p1DownKey] || keys[p1DownKey.toUpperCase()] || keys[player1Controls.down]) {
    player1.dy = PADDLE_SPEED;
  } else if (!touchPaddle || touchPaddle !== player1) {
    player1.dy = 0;
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
    const p2UpKey = player2Controls.up.toLowerCase();
    const p2DownKey = player2Controls.down.toLowerCase();
    
    if (keys[p2UpKey] || keys[p2UpKey.toUpperCase()] || keys[player2Controls.up]) {
      player2.dy = -PADDLE_SPEED;
    } else if (keys[p2DownKey] || keys[p2DownKey.toUpperCase()] || keys[player2Controls.down]) {
      player2.dy = PADDLE_SPEED;
    } else if (!touchPaddle || touchPaddle !== player2) {
      player2.dy = 0;
    }
  }

  // Update positions
  if (touchPaddle !== player1) player1.y += player1.dy;
  if (touchPaddle !== player2) player2.y += player2.dy;

  // Boundary checks
  if (player1.y < 0) player1.y = 0;
  if (player1.y + player1.height > canvas.height) {
    player1.y = canvas.height - player1.height;
  }
  if (player2.y < 0) player2.y = 0;
  if (player2.y + player2.height > canvas.height) {
    player2.y = canvas.height - player2.height;
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
    ball.dx = Math.abs(ball.dx);
    const hitPos = (ball.y - (player1.y + player1.height / 2)) / (player1.height / 2);
    ball.dy = hitPos * ball.speed;
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
    ball.dx = -Math.abs(ball.dx);
    const hitPos = (ball.y - (player2.y + player2.height / 2)) / (player2.height / 2);
    ball.dy = hitPos * ball.speed;
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

  // Draw "Press SPACE to start" message
  if (!gameStarted && !gameOver) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACE to start', canvas.width / 2, canvas.height / 2 + 50);
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
