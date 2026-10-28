/**
 * World & Environment Management
 * Parallax NYC Skyline, Oscorp & Doc Ock Obstacles, Golden Spiders,
 * Comic Action Popups ("THWIP!", "AMAZING!"), and particle effects.
 */
class SpiderWorld {
  constructor(canvas) {
    this.canvas = canvas;
    this.pipes = [];
    this.collectibles = [];
    this.popups = [];
    this.sparks = [];

    this.pipeWidth = 68;
    this.pipeGap = 160; // gap height between top and bottom obstacles
    this.pipeSpacing = 240; // horizontal distance between pipe sets
    this.spawnTimer = 0;
    this.speed = 2.8;

    // Parallax background layers
    this.bgStars = [];
    this.bgFarBuildings = [];
    this.bgMidBuildings = [];
    this.initBackground();
  }

  initBackground() {
    // Generate stars
    this.bgStars = [];
    for (let i = 0; i < 60; i++) {
      this.bgStars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * (this.canvas.height * 0.6),
        size: Math.random() * 1.8 + 0.5,
        twinkle: Math.random() * Math.PI
      });
    }

    // Generate distant skyline
    this.bgFarBuildings = [];
    let curX = 0;
    while (curX < this.canvas.width + 200) {
      const w = 40 + Math.random() * 50;
      const h = 140 + Math.random() * 160;
      this.bgFarBuildings.push({
        x: curX,
        width: w,
        height: h,
        hasSpire: Math.random() > 0.6,
        color: '#0d152a'
      });
      curX += w - 2;
    }

    // Generate midground skyline with windows
    this.bgMidBuildings = [];
    curX = 0;
    let bIndex = 0;
    while (curX < this.canvas.width + 300) {
      const w = 55 + Math.random() * 60;
      const h = 90 + Math.random() * 140;
      const hasLogo = (bIndex % 4 === 1) ? 'OSCORP' : (bIndex % 4 === 3 ? 'BUGLE' : null);
      this.bgMidBuildings.push({
        x: curX,
        width: w,
        height: h,
        color: '#15213b',
        logo: hasLogo,
        windowRows: Math.floor(h / 18),
        windowCols: Math.floor(w / 14)
      });
      curX += w - 4;
      bIndex++;
    }
  }

  reset() {
    this.pipes = [];
    this.collectibles = [];
    this.popups = [];
    this.sparks = [];
    this.spawnTimer = 0;
    this.speed = 2.8;
  }

  spawnPipe() {
    const minHeight = 70;
    const maxHeight = this.canvas.height - this.pipeGap - minHeight - 60;
    const topHeight = Math.floor(minHeight + Math.random() * (maxHeight - minHeight));
    const bottomY = topHeight + this.pipeGap;
    const bottomHeight = this.canvas.height - bottomY;

    const pipeSet = {
      x: this.canvas.width + 20,
      width: this.pipeWidth,
      topHeight: topHeight,
      bottomY: bottomY,
      bottomHeight: bottomHeight,
      passed: false,
      style: Math.random() > 0.4 ? 'oscorp' : 'doc_ock', // Oscorp tower or Doc Ock tentacle column
      lightPulse: 0
    };

    this.pipes.push(pipeSet);

    // 40% chance to spawn a bonus Golden Spider in the middle of the gap
    if (Math.random() < 0.45) {
      this.collectibles.push({
        x: pipeSet.x + this.pipeWidth / 2,
        y: topHeight + this.pipeGap / 2,
        radius: 14,
        angle: 0,
        collected: false
      });
    }
  }

  addPopup(text, x, y, color = '#ffeb3b') {
    this.popups.push({
      text: text,
      x: x,
      y: y,
      vy: -1.8,
      alpha: 1.0,
      scale: 1.4,
      color: color
    });
  }

  addSparks(x, y, count = 10, color = '#ffd700') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.sparks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        alpha: 1.0,
        color: color
      });
    }
  }

  update(score = 0) {
    // Dynamic difficulty: speed increases gently with score
    this.speed = 2.8 + Math.min(score * 0.08, 3.2);

    // Parallax scrolling
    // Distant buildings
    for (let b of this.bgFarBuildings) {
      b.x -= this.speed * 0.15;
    }
    if (this.bgFarBuildings.length > 0 && this.bgFarBuildings[0].x + this.bgFarBuildings[0].width < 0) {
      const first = this.bgFarBuildings.shift();
      const last = this.bgFarBuildings[this.bgFarBuildings.length - 1];
      first.x = last.x + last.width - 2;
      this.bgFarBuildings.push(first);
    }

    // Midground buildings
    for (let b of this.bgMidBuildings) {
      b.x -= this.speed * 0.35;
    }
    if (this.bgMidBuildings.length > 0 && this.bgMidBuildings[0].x + this.bgMidBuildings[0].width < 0) {
      const first = this.bgMidBuildings.shift();
      const last = this.bgMidBuildings[this.bgMidBuildings.length - 1];
      first.x = last.x + last.width - 4;
      this.bgMidBuildings.push(first);
    }

    // Spawn pipes
    this.spawnTimer += this.speed;
    if (this.spawnTimer >= this.pipeSpacing) {
      this.spawnPipe();
      this.spawnTimer = 0;
    }

    // Update pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.x -= this.speed;
      p.lightPulse = (p.lightPulse + 0.08) % (Math.PI * 2);

      if (p.x + p.width < -40) {
        this.pipes.splice(i, 1);
      }
    }

    // Update collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      c.x -= this.speed;
      c.angle += 0.06;
      c.y += Math.sin(c.angle * 2) * 0.4; // gentle hover bobbing

      if (c.x < -30 || c.collected) {
        this.collectibles.splice(i, 1);
      }
    }

    // Update popups
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pop = this.popups[i];
      pop.y += pop.vy;
      pop.alpha -= 0.025;
      pop.scale = Math.max(1.0, pop.scale - 0.02);
      if (pop.alpha <= 0) {
        this.popups.splice(i, 1);
      }
    }

    // Update sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.15; // spark gravity
      s.alpha -= 0.035;
      if (s.alpha <= 0) {
        this.sparks.splice(i, 1);
      }
    }
  }

  drawBackground(ctx) {
    const W = this.canvas.width;
    const H = this.canvas.height;

    // 1. Comic Sky Gradient: Sunset into Marvel Night
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#0a0d1a');    // Deep cosmic space
    skyGrad.addColorStop(0.35, '#161d36'); // Midnight blue
    skyGrad.addColorStop(0.7, '#3b1836');  // Crimson twilight haze
    skyGrad.addColorStop(1, '#66222b');    // City neon glow
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Comic Moon
    ctx.save();
    ctx.fillStyle = '#fff9d6';
    ctx.shadowColor = '#ffeaa7';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(W * 0.82, 80, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Twinkling stars
    ctx.fillStyle = '#ffffff';
    for (let s of this.bgStars) {
      const alpha = 0.4 + 0.6 * Math.sin(s.twinkle += 0.03);
      ctx.globalAlpha = Math.max(0.1, alpha);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 2. Far Buildings Layer
    for (let b of this.bgFarBuildings) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, H - b.height, b.width, b.height);
      if (b.hasSpire) {
        ctx.beginPath();
        ctx.moveTo(b.x + b.width / 2, H - b.height - 24);
        ctx.lineTo(b.x + b.width / 2 - 4, H - b.height);
        ctx.lineTo(b.x + b.width / 2 + 4, H - b.height);
        ctx.fill();
        // Red flashing aircraft warning beacon on top of spire
        const beaconOn = (Date.now() % 1000) > 500;
        if (beaconOn) {
          ctx.fillStyle = '#ff2a2a';
          ctx.beginPath();
          ctx.arc(b.x + b.width / 2, H - b.height - 24, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 3. Midground Buildings with windows and neon logos
    for (let b of this.bgMidBuildings) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, H - b.height, b.width, b.height);

      // Building edge highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(b.x, H - b.height, 2, b.height);

      // Windows
      ctx.fillStyle = 'rgba(255, 235, 140, 0.35)';
      for (let r = 1; r < b.windowRows; r++) {
        for (let c = 1; c < b.windowCols; c++) {
          // Semi-random lit window pattern
          if ((r * 7 + c * 13) % 5 !== 0) {
            ctx.fillRect(b.x + c * 12 + 2, H - b.height + r * 16, 5, 8);
          }
        }
      }

      // Neon Billboard on rooftops
      if (b.logo === 'OSCORP') {
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 9px monospace';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 8;
        ctx.fillText('OSCORP', b.x + 4, H - b.height + 12);
        ctx.shadowBlur = 0;
      } else if (b.logo === 'BUGLE') {
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 9px "Impact", sans-serif';
        ctx.shadowColor = '#ff2222';
        ctx.shadowBlur = 8;
        ctx.fillText('DAILY BUGLE', b.x + 2, H - b.height + 12);
        ctx.shadowBlur = 0;
      }
    }
  }

  drawObstacles(ctx) {
    // Draw all pipes (Oscorp & Doc Ock high-tech obstacles)
    for (let p of this.pipes) {
      const glow = 0.5 + 0.5 * Math.sin(p.lightPulse);

      // Top Obstacle (Industrial column descending)
      this.drawPipeSection(ctx, p.x, 0, p.width, p.topHeight, true, p.style, glow);

      // Bottom Obstacle (Industrial column ascending)
      this.drawPipeSection(ctx, p.x, p.bottomY, p.width, p.bottomHeight, false, p.style, glow);
    }

    // Draw Collectibles (Golden Spiders)
    for (let c of this.collectibles) {
      ctx.save();
      ctx.translate(c.x, c.y);

      // Golden Spider Aura
      const auraGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 18);
      auraGrad.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
      auraGrad.addColorStop(1, 'rgba(255, 140, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      // Golden Spider Badge
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Spider emblem inside
      ctx.fillStyle = '#7a1010';
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Little golden spider legs
      ctx.strokeStyle = '#7a1010';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-2, -2); ctx.lineTo(-6, -5);
      ctx.moveTo(-2, 0); ctx.lineTo(-7, 0);
      ctx.moveTo(-2, 2); ctx.lineTo(-6, 5);
      ctx.moveTo(2, -2); ctx.lineTo(6, -5);
      ctx.moveTo(2, 0); ctx.lineTo(7, 0);
      ctx.moveTo(2, 2); ctx.lineTo(6, 5);
      ctx.stroke();

      ctx.restore();
    }

    // Draw Sparks
    for (let s of this.sparks) {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Comic Action Popups ("THWIP!", "AMAZING!", etc.)
    for (let pop of this.popups) {
      ctx.save();
      ctx.globalAlpha = pop.alpha;
      ctx.translate(pop.x, pop.y);
      ctx.scale(pop.scale, pop.scale);

      // Comic burst bubble
      ctx.font = '900 20px "Bangers", "Impact", cursive, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Thick comic outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 5;
      ctx.strokeText(pop.text, 0, 0);

      // Vibrant fill
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, 0, 0);
      ctx.restore();
    }
  }

  drawPipeSection(ctx, x, y, width, height, isTop, style, glow) {
    ctx.save();

    // Column Base Gradient
    const colGrad = ctx.createLinearGradient(x, 0, x + width, 0);
    if (style === 'oscorp') {
      // Oscorp Industrial Metallic Green / Charcoal
      colGrad.addColorStop(0, '#121e1a');
      colGrad.addColorStop(0.35, '#28453b');
      colGrad.addColorStop(0.7, '#192b25');
      colGrad.addColorStop(1, '#0c1512');
    } else {
      // Doc Ock Steel Girder / Industrial Armor
      colGrad.addColorStop(0, '#1c1f26');
      colGrad.addColorStop(0.35, '#3b4352');
      colGrad.addColorStop(0.7, '#272c36');
      colGrad.addColorStop(1, '#11141a');
    }

    ctx.fillStyle = colGrad;
    ctx.fillRect(x, y, width, height);

    // Hazard Stripes & Rivets
    const stripeW = 10;
    ctx.fillStyle = style === 'oscorp' ? `rgba(0, 255, 140, ${0.4 + glow * 0.3})` : `rgba(255, 180, 0, ${0.4 + glow * 0.3})`;
    
    // Warning accent stripe along the column
    ctx.fillRect(x + width - 12, y, 4, height);

    // Metallic Pipe Cap (The rim facing the gap)
    const capHeight = 24;
    const capWidth = width + 10;
    const capX = x - 5;
    const capY = isTop ? (y + height - capHeight) : y;

    const capGrad = ctx.createLinearGradient(capX, 0, capX + capWidth, 0);
    capGrad.addColorStop(0, '#222');
    capGrad.addColorStop(0.4, '#555e6d');
    capGrad.addColorStop(1, '#181a20');
    ctx.fillStyle = capGrad;
    ctx.roundRect(capX, capY, capWidth, capHeight, 4);
    ctx.fill();

    // Cap border & rivets
    ctx.strokeStyle = style === 'oscorp' ? '#00ffaa' : '#ffb300';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glowing energy core or warning light on cap
    ctx.fillStyle = style === 'oscorp' ? `rgba(0, 255, 150, ${glow})` : `rgba(255, 50, 50, ${glow})`;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(capX + capWidth / 2, capY + capHeight / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Webbing trapped on the obstacle corners!
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const cornerY = isTop ? capY : (capY + capHeight);
    ctx.moveTo(capX, cornerY);
    ctx.lineTo(capX + 16, isTop ? cornerY - 14 : cornerY + 14);
    ctx.moveTo(capX, cornerY);
    ctx.lineTo(capX + 22, cornerY);
    ctx.stroke();

    ctx.restore();
  }
}

window.SpiderWorld = SpiderWorld;
