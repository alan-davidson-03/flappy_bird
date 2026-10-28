/**
 * Spider-Man Flappy Game Main Controller
 * State Machine, Score & Combo Engine, Collision Physics, UI Overlays.
 */
class SpiderGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // High DPI Canvas Scaling
    this.initCanvasSize();

    this.player = new SpiderPlayer(this.canvas);
    this.world = new SpiderWorld(this.canvas);
    this.audio = window.spiderAudio;

    this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'GAMEOVER'
    this.score = 0;
    this.spidersCollected = 0;
    this.highScore = parseInt(localStorage.getItem('spiderman_flappy_high') || '0', 10);
    this.combo = 0;

    // UI elements
    this.hudScore = document.getElementById('current-score');
    this.hudHigh = document.getElementById('high-score');
    this.hudSpiders = document.getElementById('spiders-count');
    this.modalMenu = document.getElementById('modal-menu');
    this.modalGameOver = document.getElementById('modal-gameover');
    this.modalPause = document.getElementById('modal-pause');
    this.finalScoreEl = document.getElementById('final-score');
    this.bestScoreEl = document.getElementById('best-score');
    this.comicRatingEl = document.getElementById('comic-rating');

    this.initInputs();
    this.initHandTracking();
    this.updateHUD();

    // Start render loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  initCanvasSize() {
    // Base internal resolution
    this.canvas.width = 440;
    this.canvas.height = 680;
  }

  initInputs() {
    // 1. Keyboard
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.handleAction();
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        this.togglePause();
      }
      if (e.key === 'm' || e.key === 'M') {
        if (this.audio) {
          const on = this.audio.toggleBGM();
          const bgmToggleBtn = document.getElementById('btn-toggle-bgm');
          if (bgmToggleBtn) {
            bgmToggleBtn.textContent = on ? '🎵 Music: ON' : '🎵 Music: OFF';
            bgmToggleBtn.classList.toggle('active', on);
          }
        }
      }
    });

    // 2. Click or Touch on Canvas
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.handleAction();
    });

    // 3. Buttons
    const startBtn = document.getElementById('btn-start');
    if (startBtn) startBtn.addEventListener('click', () => this.startGame());

    const restartBtn = document.getElementById('btn-restart');
    if (restartBtn) restartBtn.addEventListener('click', () => this.startGame());

    const resumeBtn = document.getElementById('btn-resume');
    if (resumeBtn) resumeBtn.addEventListener('click', () => this.togglePause());

    const pauseToggleBtn = document.getElementById('btn-toggle-pause');
    if (pauseToggleBtn) pauseToggleBtn.addEventListener('click', () => this.togglePause());

    const camToggleBtn = document.getElementById('btn-toggle-cam');
    if (camToggleBtn) {
      camToggleBtn.addEventListener('click', () => {
        if (this.handTracker.isCameraActive) {
          this.handTracker.stopCamera();
          camToggleBtn.textContent = '📷 Turn On Camera';
          camToggleBtn.classList.remove('active');
        } else {
          this.handTracker.startCamera();
          camToggleBtn.textContent = '📷 Turn Off Camera';
          camToggleBtn.classList.add('active');
        }
      });
    }

    const soundToggleBtn = document.getElementById('btn-toggle-sound');
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        this.audio.soundEnabled = !this.audio.soundEnabled;
        soundToggleBtn.textContent = this.audio.soundEnabled ? '🔊 SFX: ON' : '🔇 SFX: OFF';
      });
    }

    const bgmToggleBtn = document.getElementById('btn-toggle-bgm');
    if (bgmToggleBtn) {
      bgmToggleBtn.addEventListener('click', () => {
        const on = this.audio.toggleBGM();
        bgmToggleBtn.textContent = on ? '🎵 Music: ON' : '🎵 Music: OFF';
        bgmToggleBtn.classList.toggle('active', on);
      });
    }

    const sensitivitySlider = document.getElementById('slider-sensitivity');
    if (sensitivitySlider) {
      sensitivitySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.handTracker.setSensitivity(val);
      });
    }
  }

  initHandTracking() {
    const video = document.getElementById('webcam-video');
    const hudCanvas = document.getElementById('hud-canvas');
    const statusText = document.getElementById('sensor-status');

    this.handTracker = new SpiderHandTracker({
      videoElement: video,
      hudCanvas: hudCanvas,
      onPinchTap: () => {
        // Pinch detected: Flap!
        this.handleAction();
      },
      onStatusChange: (code, message) => {
        if (statusText) {
          statusText.textContent = message;
          statusText.className = 'sensor-badge ' + code.toLowerCase();
        }
      }
    });

    // Auto-attempt webcam startup for finger gestures
    setTimeout(() => {
      this.handTracker.startCamera();
    }, 600);
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      if (this.modalPause) this.modalPause.classList.remove('hidden');
      const pauseBtn = document.getElementById('btn-toggle-pause');
      if (pauseBtn) pauseBtn.textContent = '▶️ Resume (P)';
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      if (this.modalPause) this.modalPause.classList.add('hidden');
      const pauseBtn = document.getElementById('btn-toggle-pause');
      if (pauseBtn) pauseBtn.textContent = '⏸️ Pause (P)';
    }
  }

  handleAction() {
    if (this.state === 'MENU') {
      this.startGame();
    } else if (this.state === 'PAUSED') {
      this.togglePause();
    } else if (this.state === 'PLAYING') {
      this.player.jump();
      // Show comic "THWIP!" popup near Spider-Man
      if (Math.random() > 0.4) {
        this.world.addPopup('THWIP!', this.player.x + 25, this.player.y - 20, '#ffffff');
      }
    } else if (this.state === 'GAMEOVER') {
      this.startGame();
    }
  }

  startGame() {
    this.score = 0;
    this.spidersCollected = 0;
    this.combo = 0;
    this.player.reset();
    this.world.reset();

    this.state = 'PLAYING';
    this.modalMenu.classList.add('hidden');
    this.modalGameOver.classList.add('hidden');
    if (this.modalPause) this.modalPause.classList.add('hidden');
    const pauseBtn = document.getElementById('btn-toggle-pause');
    if (pauseBtn) pauseBtn.textContent = '⏸️ Pause (P)';

    this.updateHUD();
    this.player.jump();
    this.world.addPopup('GO SPIDER!', this.player.x + 30, this.player.y, '#ffd700');
  }

  gameOver() {
    if (this.state === 'GAMEOVER') return;
    this.state = 'GAMEOVER';

    this.audio.playHit();

    // High score check
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('spiderman_flappy_high', this.highScore.toString());
    }

    // Comic Rating text
    let rating = 'ROOKIE WEBSLINGER';
    if (this.score >= 5) rating = 'FRIENDLY NEIGHBORHOOD HERO';
    if (this.score >= 15) rating = 'SPECTACULAR SPIDER-MAN!';
    if (this.score >= 25) rating = 'AMAZING SUPERHERO!';
    if (this.score >= 40) rating = 'AVENGERS MVP! 🕷️';

    this.finalScoreEl.textContent = this.score;
    this.bestScoreEl.textContent = this.highScore;
    this.comicRatingEl.textContent = rating;

    // Shake canvas
    this.canvas.classList.add('screen-shake');
    setTimeout(() => this.canvas.classList.remove('screen-shake'), 400);

    // Show modal after slight pause
    setTimeout(() => {
      this.modalGameOver.classList.remove('hidden');
    }, 500);
  }

  updateHUD() {
    if (this.hudScore) this.hudScore.textContent = this.score;
    if (this.hudHigh) this.hudHigh.textContent = this.highScore;
    if (this.hudSpiders) this.hudSpiders.textContent = this.spidersCollected;
  }

  checkCollisions() {
    const bounds = this.player.getBounds();

    // 1. Boundary check: Floor & Ceiling
    if (bounds.centerY + bounds.radius >= this.canvas.height - 15) {
      this.gameOver();
      return;
    }
    if (bounds.centerY - bounds.radius <= 0) {
      this.player.y = bounds.radius;
      this.player.velocity = 0;
    }

    // 2. Obstacles check
    for (let pipe of this.world.pipes) {
      // Circle vs Top Rectangle
      if (this.circleIntersectsRect(
        bounds.centerX, bounds.centerY, bounds.radius,
        pipe.x, 0, pipe.width, pipe.topHeight
      )) {
        this.world.addSparks(bounds.centerX, bounds.centerY, 16, '#ff4444');
        this.gameOver();
        return;
      }

      // Circle vs Bottom Rectangle
      if (this.circleIntersectsRect(
        bounds.centerX, bounds.centerY, bounds.radius,
        pipe.x, pipe.bottomY, pipe.width, pipe.bottomHeight
      )) {
        this.world.addSparks(bounds.centerX, bounds.centerY, 16, '#ff4444');
        this.gameOver();
        return;
      }

      // Score passing pipe
      if (!pipe.passed && pipe.x + pipe.width < this.player.x) {
        pipe.passed = true;
        this.score++;
        this.combo++;
        this.audio.playScore();

        // Comic milestone popups
        if (this.combo === 5) this.world.addPopup('SWEET!', this.player.x + 30, this.player.y - 25, '#00ffcc');
        else if (this.combo === 10) this.world.addPopup('SPECTACULAR!', this.player.x + 30, this.player.y - 25, '#ffd700');
        else if (this.combo === 20) this.world.addPopup('AMAZING!', this.player.x + 30, this.player.y - 25, '#ff0055');

        this.updateHUD();
      }
    }

    // 3. Collectibles check (Golden Spiders)
    for (let c of this.world.collectibles) {
      if (!c.collected) {
        const dist = Math.hypot(bounds.centerX - c.x, bounds.centerY - c.y);
        if (dist < bounds.radius + c.radius) {
          c.collected = true;
          this.score += 5;
          this.spidersCollected++;
          this.audio.playBonus();
          this.world.addSparks(c.x, c.y, 14, '#ffd700');
          this.world.addPopup('+5 SPIDER BONUS!', c.x, c.y - 15, '#ffd700');
          this.updateHUD();
        }
      }
    }
  }

  circleIntersectsRect(cx, cy, radius, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const distX = cx - closestX;
    const distY = cy - closestY;
    return (distX * distX + distY * distY) < (radius * radius);
  }

  loop(currentTime) {
    requestAnimationFrame((t) => this.loop(t));

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw Parallax NYC Skyline
    this.world.drawBackground(this.ctx);

    // 2. Update logic
    if (this.state === 'PLAYING') {
      this.player.update();
      this.world.update(this.score);
      this.checkCollisions();
    } else if (this.state === 'PAUSED') {
      // Game state frozen during pause
    } else if (this.state === 'MENU') {
      // Floating gentle hover for Spider-Man in menu
      this.player.y = (this.canvas.height / 2 - 30) + Math.sin(currentTime * 0.003) * 12;
      this.player.rotation = Math.sin(currentTime * 0.003) * 0.1;
      this.world.update(0);
    } else if (this.state === 'GAMEOVER') {
      // Spider-Man falls to ground on game over
      if (this.player.y < this.canvas.height - 40) {
        this.player.velocity += 0.5;
        this.player.y += this.player.velocity;
        this.player.rotation = Math.min(this.player.rotation + 0.05, 1.4);
      }
      this.world.update(0);
    }

    // 3. Draw Obstacles & Collectibles
    this.world.drawObstacles(this.ctx);

    // 4. Draw Player
    this.player.draw(this.ctx);

    // 5. Pause Overlay
    if (this.state === 'PAUSED') {
      this.ctx.fillStyle = 'rgba(8, 13, 26, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// Instantiate game on page load
window.addEventListener('DOMContentLoaded', () => {
  window.spiderGame = new SpiderGame();
});
