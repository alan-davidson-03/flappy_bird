/**
 * MediaPipe Hands Finger Tip Pinch Detector & Spider-HUD Visualizer
 * Tracks Landmark 4 (Thumb Tip) & Landmark 8 (Index Finger Tip).
 * Fires flap/jump event when user taps pointer & thumb together!
 */
class SpiderHandTracker {
  constructor(options = {}) {
    this.videoElement = options.videoElement;
    this.hudCanvas = options.hudCanvas;
    this.hudCtx = this.hudCanvas ? this.hudCanvas.getContext('2d') : null;
    this.onPinchTap = options.onPinchTap || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});

    this.hands = null;
    this.camera = null;
    this.isTracking = false;
    this.isCameraActive = false;

    // Gesture detection parameters
    this.isPinching = false;
    this.lastPinchTime = 0;
    this.pinchThreshold = 0.34; // Normalized distance threshold
    this.minPinchInterval = 120; // ms debounce between taps
    this.currentDistance = 1.0;
    this.lastLandmarks = null;
    this.pinchFlashTimer = 0;

    // Smoothing
    this.smoothDistance = 1.0;
  }

  setSensitivity(val) {
    // val from 1 (easy/loose pinch) to 10 (tight pinch)
    // Map 1-10 to threshold 0.45 down to 0.22
    this.pinchThreshold = 0.22 + ((11 - val) / 10) * 0.22;
  }

  async startCamera() {
    this.onStatusChange('INITIALIZING', 'Spider-Sensor Initializing...');

    if (typeof Hands === 'undefined') {
      this.onStatusChange('ERROR', 'MediaPipe Hands library not loaded. Use SPACE / Click to play!');
      return false;
    }

    try {
      this.hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.55
      });

      this.hands.onResults((results) => this.onHandResults(results));

      if (typeof Camera !== 'undefined') {
        this.camera = new Camera(this.videoElement, {
          onFrame: async () => {
            if (this.isCameraActive && this.videoElement.videoWidth > 0) {
              await this.hands.send({ image: this.videoElement });
            }
          },
          width: 320,
          height: 240
        });

        await this.camera.start();
        this.isCameraActive = true;
        this.isTracking = true;
        this.onStatusChange('READY', 'Spider-Sensor Active! Tap Index + Thumb to Fly!');
        return true;
      } else {
        // Fallback using direct getUserMedia
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' }
        });
        this.videoElement.srcObject = stream;
        await this.videoElement.play();
        this.isCameraActive = true;
        this.isTracking = true;

        const processVideo = async () => {
          if (this.isCameraActive) {
            await this.hands.send({ image: this.videoElement });
            requestAnimationFrame(processVideo);
          }
        };
        requestAnimationFrame(processVideo);
        this.onStatusChange('READY', 'Spider-Sensor Active! Tap Index + Thumb to Fly!');
        return true;
      }
    } catch (err) {
      console.warn('Camera initialization error:', err);
      this.isCameraActive = false;
      this.onStatusChange('ERROR', 'Camera access denied or unavailable. Space / Tap works!');
      return false;
    }
  }

  stopCamera() {
    this.isCameraActive = false;
    if (this.camera) {
      try { this.camera.stop(); } catch(e){}
    }
    if (this.videoElement && this.videoElement.srcObject) {
      const tracks = this.videoElement.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }
    this.onStatusChange('PAUSED', 'Camera Off (Click/Space Active)');
  }

  onHandResults(results) {
    if (!this.hudCtx) return;
    const ctx = this.hudCtx;
    const W = this.hudCanvas.width;
    const H = this.hudCanvas.height;

    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // Mirror horizontal for natural webcam feel
    ctx.translate(W, 0);
    ctx.scale(-1, 1);

    if (this.videoElement && this.videoElement.videoWidth > 0) {
      ctx.drawImage(this.videoElement, 0, 0, W, H);
      // Dark high-tech tint over video
      ctx.fillStyle = 'rgba(10, 16, 30, 0.4)';
      ctx.fillRect(0, 0, W, H);
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      this.lastLandmarks = landmarks;

      // Landmark 4: Thumb Tip
      // Landmark 8: Index Finger Tip
      const thumb = landmarks[4];
      const index = landmarks[8];

      // Hand scale reference: Landmark 0 (Wrist) to Landmark 9 (Middle MCP)
      const wrist = landmarks[0];
      const middleMcp = landmarks[9];
      const handScale = Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y) || 0.3;

      // Raw distance between pointer and thumb tip
      const rawDist = Math.hypot(thumb.x - index.x, thumb.y - index.y);
      const normDist = rawDist / handScale;

      // Smooth distance filter
      this.smoothDistance = this.smoothDistance * 0.4 + normDist * 0.6;
      this.currentDistance = this.smoothDistance;

      // Check pinch threshold
      const isCurrentlyPinching = this.currentDistance < this.pinchThreshold;
      const now = Date.now();

      // Trigger jump on rising edge of pinch tap
      if (isCurrentlyPinching && !this.isPinching && (now - this.lastPinchTime > this.minPinchInterval)) {
        this.isPinching = true;
        this.lastPinchTime = now;
        this.pinchFlashTimer = 10;
        this.onPinchTap();
      } else if (!isCurrentlyPinching && this.currentDistance > this.pinchThreshold * 1.15) {
        // Reset pinch state once fingers open up slightly
        this.isPinching = false;
      }

      // Draw hand landmarks & connecting web laser
      this.drawHandOverlay(ctx, landmarks, W, H, thumb, index, isCurrentlyPinching);
    } else {
      this.currentDistance = 1.0;
    }

    ctx.restore();

    // Draw HUD metrics on non-mirrored coordinate space
    this.drawHUDMetrics();
  }

  drawHandOverlay(ctx, landmarks, W, H, thumb, index, isPinching) {
    // 1. Draw web connection line between thumb and index finger tip
    const tx = thumb.x * W;
    const ty = thumb.y * H;
    const ix = index.x * W;
    const iy = index.y * H;

    // Line color turns from cyan -> yellow -> neon red/green when pinching
    let lineColor = '#00f0ff';
    if (this.currentDistance < this.pinchThreshold * 1.2) {
      lineColor = isPinching ? '#00ff66' : '#ffd700';
    }

    ctx.save();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = isPinching ? 5 : 2.5;
    ctx.shadowColor = lineColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(ix, iy);
    ctx.stroke();

    // Midpoint web node
    const midX = (tx + ix) / 2;
    const midY = (ty + iy) / 2;
    ctx.fillStyle = isPinching ? '#ffffff' : lineColor;
    ctx.beginPath();
    ctx.arc(midX, midY, isPinching ? 6 : 3, 0, Math.PI * 2);
    ctx.fill();

    // 2. Thumb Tip (Red node)
    ctx.fillStyle = '#ff2244';
    ctx.shadowColor = '#ff2244';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(tx, ty, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Index Tip (Cyan node)
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(ix, iy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw other joints subtly
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 0;
    [0, 2, 3, 5, 6, 7, 9, 13, 17].forEach(idx => {
      const lm = landmarks[idx];
      ctx.beginPath();
      ctx.arc(lm.x * W, lm.y * H, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Tap shockwave ripple if just tapped
    if (this.pinchFlashTimer > 0) {
      const radius = (10 - this.pinchFlashTimer) * 4 + 10;
      ctx.strokeStyle = `rgba(0, 255, 120, ${this.pinchFlashTimer / 10})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(midX, midY, radius, 0, Math.PI * 2);
      ctx.stroke();
      this.pinchFlashTimer--;
    }

    ctx.restore();
  }

  drawHUDMetrics() {
    const ctx = this.hudCtx;
    const W = this.hudCanvas.width;
    const H = this.hudCanvas.height;

    ctx.save();
    // Spider Web HUD corners
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1.5;
    const cornerSize = 14;
    // Top-left
    ctx.beginPath(); ctx.moveTo(6, 6 + cornerSize); ctx.lineTo(6, 6); ctx.lineTo(6 + cornerSize, 6); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(W - 6, 6 + cornerSize); ctx.lineTo(W - 6, 6); ctx.lineTo(W - 6 - cornerSize, 6); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(6, H - 6 - cornerSize); ctx.lineTo(6, H - 6); ctx.lineTo(6 + cornerSize, H - 6); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(W - 6, H - 6 - cornerSize); ctx.lineTo(W - 6, H - 6); ctx.lineTo(W - 6 - cornerSize, H - 6); ctx.stroke();

    // Pinch Meter Bar at bottom of HUD
    const meterW = W - 28;
    const meterH = 6;
    const meterX = 14;
    const meterY = H - 14;

    // Meter Background
    ctx.fillStyle = 'rgba(20, 30, 45, 0.8)';
    ctx.roundRect(meterX, meterY, meterW, meterH, 3);
    ctx.fill();

    // Pinch closeness ratio (1 when touching, 0 when far apart)
    const closeness = Math.max(0, Math.min(1, 1 - (this.currentDistance / (this.pinchThreshold * 2.2))));
    const fillW = meterW * closeness;

    let barColor = '#00d4ff';
    if (closeness > 0.7) barColor = '#ffd700';
    if (this.isPinching) barColor = '#00ff66';

    ctx.fillStyle = barColor;
    ctx.roundRect(meterX, meterY, fillW, meterH, 3);
    ctx.fill();

    // Threshold indicator line
    const threshX = meterX + meterW * (1 - (this.pinchThreshold / (this.pinchThreshold * 2.2)));
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(threshX, meterY - 2, 2, meterH + 4);

    // Label
    ctx.font = 'bold 9px "Rajdhani", monospace, sans-serif';
    ctx.fillStyle = this.isPinching ? '#00ff66' : '#a0c0e0';
    ctx.textAlign = 'center';
    const statusText = this.isPinching ? '⚡ THWIP! TAP DETECTED ⚡' : 'POINTER + THUMB SENSOR';
    ctx.fillText(statusText, W / 2, meterY - 4);

    ctx.restore();
  }
}

window.SpiderHandTracker = SpiderHandTracker;
