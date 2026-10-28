/**
 * Spider-Man Player Entity
 * High-definition procedural canvas rendering with dynamic animations,
 * web-slinging mechanics, expressive eyes, and comic effects.
 */
// Canvas roundRect polyfill for maximum browser compatibility
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r = 0) {
    if (typeof r === 'number') r = [r, r, r, r];
    const [tl, tr, br, bl] = r;
    this.beginPath();
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + tr);
    this.lineTo(x + w, y + h - br);
    this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    this.lineTo(x + bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - bl);
    this.lineTo(x, y + tl);
    this.quadraticCurveTo(x, y, x + tl, y);
    this.closePath();
    return this;
  };
}

class SpiderPlayer {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset();
  }

  reset() {
    this.x = 120;
    this.y = this.canvas.height / 2 - 20;
    this.width = 44;
    this.height = 36;
    this.radius = 20;

    this.velocity = 0;
    this.gravity = 0.38;
    this.jumpStrength = -7.8;
    this.rotation = 0;

    // Web shooting visual effect
    this.webActive = false;
    this.webTimer = 0;
    this.webAnchorX = 0;
    this.webAnchorY = 0;

    // Animation frames
    this.squintFactor = 1.0; // Dynamic eye expression
    this.swingFrame = 0;
    this.particles = [];
  }

  jump() {
    this.velocity = this.jumpStrength;
    this.rotation = -0.45; // ~ -25 degrees
    this.squintFactor = 0.6; // squint heroically on launch
    
    // Web line anchor point above and slightly ahead of Spider-Man
    this.webActive = true;
    this.webTimer = 14; // frames to display web line
    this.webAnchorX = this.x + 80 + Math.random() * 40;
    this.webAnchorY = Math.max(10, this.y - 140 - Math.random() * 40);

    // Spawn web-puff particles
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: this.x - 10,
        y: this.y + 4,
        vx: -1.5 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 2,
        alpha: 0.9,
        size: 3 + Math.random() * 3,
        color: '#ffffff'
      });
    }

    if (window.spiderAudio) {
      window.spiderAudio.playThwip();
    }
  }

  update() {
    // Gravity and physics
    this.velocity += this.gravity;
    this.velocity = Math.min(this.velocity, 10); // terminal velocity
    this.y += this.velocity;

    // Smooth rotation based on velocity
    if (this.velocity < 0) {
      this.rotation = Math.max(this.rotation - 0.05, -0.45);
    } else {
      this.rotation = Math.min(this.rotation + 0.035, 1.1); // tilts downwards when falling
    }

    // Dynamic eyes relax back
    if (this.squintFactor < 1.0) {
      this.squintFactor += 0.04;
    }

    // Web shoot visual countdown
    if (this.webTimer > 0) {
      this.webTimer--;
      if (this.webTimer === 0) {
        this.webActive = false;
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.04;
      p.size = Math.max(0.5, p.size * 0.96);
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    this.swingFrame += 0.15;
  }

  draw(ctx) {
    // Draw trailing particles
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw web shot if active
    if (this.webActive && this.webTimer > 0) {
      ctx.save();
      const alpha = Math.min(1, this.webTimer / 8);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(this.x + 12, this.y - 4);
      
      // Slight web curve
      const midX = (this.x + this.webAnchorX) / 2 + 10;
      const midY = (this.y + this.webAnchorY) / 2 - 15;
      ctx.quadraticCurveTo(midX, midY, this.webAnchorX, this.webAnchorY);
      ctx.stroke();

      // Outer web glow
      ctx.strokeStyle = `rgba(180, 220, 255, ${alpha * 0.4})`;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Dynamic scale for comic squash & stretch
    const stretch = this.velocity < -2 ? 1.08 : (this.velocity > 5 ? 0.95 : 1.0);
    ctx.scale(stretch, 1 / stretch);

    // ============================================
    // DRAW SPIDER-MAN (CHIBI / COMIC HERO STYLE)
    // ============================================

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Torso & Legs (Navy Blue & Red)
    // Left & Right navy blue body flanks
    ctx.fillStyle = '#0f2452'; // Classic navy blue
    ctx.beginPath();
    ctx.ellipse(-4, 6, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Swinging legs
    const legOffset = Math.sin(this.swingFrame) * 4;
    ctx.fillStyle = '#b7121f'; // Spider Red boots
    ctx.beginPath();
    ctx.roundRect(-16, 8 + legOffset, 10, 8, 4);
    ctx.roundRect(-22, 14 - legOffset, 12, 8, 4);
    ctx.fill();

    // 2. Red Suit Center & Head
    ctx.fillStyle = '#e21b24'; // Iconic Spider-Man scarlet red
    ctx.beginPath();
    // Head & chest combined bulb
    ctx.ellipse(2, 0, 18, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle 3D gradient highlight
    const radGrad = ctx.createRadialGradient(-3, -4, 2, 0, 0, 20);
    radGrad.addColorStop(0, 'rgba(255, 120, 120, 0.45)');
    radGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.2)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.ellipse(2, 0, 18, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Spider Emblem on Chest (black spider)
    ctx.fillStyle = '#0b0e14';
    ctx.beginPath();
    // Spider body
    ctx.ellipse(-2, 4, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Spider legs
    ctx.strokeStyle = '#0b0e14';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    // Left legs
    ctx.moveTo(-2, 2); ctx.lineTo(-7, -1); ctx.lineTo(-9, 2);
    ctx.moveTo(-2, 5); ctx.lineTo(-8, 6); ctx.lineTo(-10, 10);
    // Right legs
    ctx.moveTo(-2, 2); ctx.lineTo(3, -1); ctx.lineTo(5, 2);
    ctx.moveTo(-2, 5); ctx.lineTo(4, 6); ctx.lineTo(6, 10);
    ctx.stroke();

    // 4. Subtle Webbing on Mask
    ctx.strokeStyle = 'rgba(20, 10, 15, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Web spoke lines radiating from nose bridge
    ctx.moveTo(8, -1); ctx.lineTo(20, -1);
    ctx.moveTo(8, -1); ctx.lineTo(16, -11);
    ctx.moveTo(8, -1); ctx.lineTo(15, 9);
    ctx.moveTo(8, -1); ctx.lineTo(2, -15);
    ctx.moveTo(8, -1); ctx.lineTo(-6, -14);
    // Cross rings
    ctx.stroke();

    // 5. Expressive White Comic Eyes with thick black frames
    const eyeH = 9 * this.squintFactor;

    // Right Eye (closer to viewer)
    ctx.fillStyle = '#05070a'; // Black border
    ctx.beginPath();
    ctx.moveTo(4, -8);
    ctx.lineTo(18, -3);
    ctx.lineTo(8, -3 + eyeH);
    ctx.closePath();
    ctx.fill();

    // White eye fill
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(6, -6.5);
    ctx.lineTo(16, -3);
    ctx.lineTo(9, -3 + eyeH * 0.75);
    ctx.closePath();
    ctx.fill();

    // Eye cyan reflective sheen
    ctx.fillStyle = 'rgba(100, 220, 255, 0.45)';
    ctx.beginPath();
    ctx.moveTo(6, -6.5);
    ctx.lineTo(12, -4);
    ctx.lineTo(7, -3);
    ctx.closePath();
    ctx.fill();

    // Left Eye (far side)
    ctx.fillStyle = '#05070a';
    ctx.beginPath();
    ctx.moveTo(-2, -9);
    ctx.lineTo(4, -4);
    ctx.lineTo(-1, -4 + eyeH * 0.9);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-1, -7.5);
    ctx.lineTo(3, -4);
    ctx.lineTo(0, -4 + eyeH * 0.65);
    ctx.closePath();
    ctx.fill();

    // 6. Extended arm with Web Shooter (pointing forward)
    ctx.fillStyle = '#e21b24';
    ctx.beginPath();
    ctx.ellipse(10, 5, 6, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Silver web shooter bracelet
    ctx.fillStyle = '#d0d8e8';
    ctx.fillRect(11, 4, 3, 3);

    ctx.restore();
  }

  getBounds() {
    // Tighter circular/elliptical collision box for fair gameplay
    return {
      x: this.x - 12,
      y: this.y - 12,
      width: 24,
      height: 24,
      centerX: this.x,
      centerY: this.y,
      radius: 14
    };
  }
}

window.SpiderPlayer = SpiderPlayer;
