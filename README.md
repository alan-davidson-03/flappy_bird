# 🕷️ Spider-Man Flappy Bird (Finger Pinch Tap Edition)

An interactive, Marvel Spider-Man-themed Flappy Bird game powered by **MediaPipe Hands AI** for real-time webcam finger gesture tracking, custom HTML5 Canvas procedural rendering, and the Web Audio API.

---

## 🎮 How to Play

### 🖐️ 1. Finger Tip Pinch / Tap (Webcam Gesture)
- Hold your hand up in view of the webcam.
- **Tap your pointer (index) finger and thumb tips together**: Spider-Man shoots a web line with a "THWIP!" sound and jumps into the air!
- Keep tapping in rhythm to navigate through the obstacles.
- **Pinch Sensitivity Slider**: Use the slider on the Spider-HUD panel to adjust how close your fingers need to be based on how far you sit from your webcam.

### 🕹️ 2. Alternative Controls
- **Spacebar** / **Up Arrow** / **W key**
- **Click or Tap on the Canvas**
- **"Tap Jump" button** on the HUD panel

---

## 🌟 Features

- **Procedural Spider-Man Entity**: Hand-crafted high-resolution canvas character with iconic scarlet and navy suit, web lines, expressive comic eyes that squint dynamically when jumping, and web smoke particle trails.
- **Real-Time Spider-HUD Sensor**:
  - Live mirrored webcam overlay with MediaPipe skeleton tracking.
  - Glowing red thumb node and cyan pointer finger node connected by a dynamic laser/web distance tether.
  - Interactive pinch meter bar that flashes and emits shockwaves upon finger contact.
- **Marvel NYC Environment**:
  - Multi-layer parallax NYC skyline (deep cosmic twilight sky, glowing moon, stars, distant spires with warning beacons, and midground skyscrapers with Daily Bugle and Oscorp neon signs).
  - Oscorp high-voltage power columns and Doc Ock robotic steel towers with hazard lights and webbing.
  - Collectible **Golden Spiders** (+5 bonus points and sparkle burst).
- **Comic Superhero Effects**:
  - Floating comic action bubbles: `THWIP!`, `SWEET!`, `SPECTACULAR!`, `AMAZING SPIDER-MAN!`.
  - Dynamic screen shake on impact.
  - High score persistence with `localStorage`.
- **Web Audio API Engine**:
  - Procedural "THWIP!" web shooter sound effect.
  - Two-tone bell score chime and golden spider power sound.
  - Comic impact crunch on collision.
  - Optional retro heroic synthwave theme music toggle (`🎵 Theme: ON/OFF`).

---

## 🚀 Running Locally

The game server is running at:
```
http://127.0.0.1:3000
```

To run or restart manually at any time:
```bash
npm start
# or
node server.js
```
Then visit [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser.
