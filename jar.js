// ============================================
//   SHARED JOURNEY NAVIGATION
// ============================================
const JourneyNav = {
  KEY: 'birthdayJourneyState',
  NAV_MARKER: 'birthdayInternalNavigation',
  TRANSITION_MS: 600,
  getState() {
    try { return JSON.parse(sessionStorage.getItem(this.KEY)) || {}; }
    catch (e) { return {}; }
  },
  consumeNavigationMarker() {
    const isInternal = sessionStorage.getItem(this.NAV_MARKER) === '1';
    sessionStorage.removeItem(this.NAV_MARKER);
    if (!isInternal) sessionStorage.removeItem(this.KEY);
  },
  markInternalNavigation() {
    sessionStorage.setItem(this.NAV_MARKER, '1');
  },
  setState(partial) {
    const current = this.getState();
    sessionStorage.setItem(this.KEY, JSON.stringify(Object.assign(current, partial)));
  },
  goTo(url, rootSelector = '.page-root') {
    window.BirthdaySound?.play('page');
    const root = document.querySelector(rootSelector);
    if (!root) { this.markInternalNavigation(); window.location.href = url; return; }
    root.classList.add('page-exit');
    setTimeout(() => { this.markInternalNavigation(); window.location.href = url; }, this.TRANSITION_MS);
  },
  renderBackButton(targetUrl, onClickOverride = null) {
    const btn = document.createElement('button');
    btn.className = 'smart-back-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Go back');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 6L9 12L15 18" stroke="#ffe8f3" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    btn.addEventListener('click', onClickOverride || (() => JourneyNav.goTo(targetUrl)));
    document.body.appendChild(btn);
    return btn;
  }
};

JourneyNav.consumeNavigationMarker();
window.BgMusic?.resume();


JourneyNav.setState({ reachedJar: true });
JourneyNav.renderBackButton('memories.html');

function persistJarState() {
  JourneyNav.setState({
    jarOpen,
    jarTapCount: tapCount,
    jarTakenChits: Array.from(takenChits),
    jarNextChitIndex: nextChitIndex,
    jarAllRead: takenChits.size === CHIT_MESSAGES.length
  });
}
// ============================================
//   JAR PAGE — jar.js
// ============================================

// Perf flag: set once at load, used to lighten animation work on phones
const IS_MOBILE = window.innerWidth < 640;

// ===== CHIT MESSAGES — EDIT THESE =====
const CHIT_MESSAGES = [
  // ← REPLACE each string with your actual message
  "One shyari for you(though I haven't written it but still, I like it for you...)",

"woh class mai parne aya karti thi\nmai usko dekhne jata tha...\n\nwoh class mai parne aya karti thi\nmai usko dekhne jata tha...\n\nwoh top kiya karti thi\nmai bash uske liye pass hua karta tha...",

  "This isn't just a Birthday Wish...\n It's always something I have wanted to tell...\nI know tui abar dhur dhur korbi... But still\nit's always been you... & it's your day\nSoo just enjoy it...🥳🥳🥳",

  "amar Puchke majhe majhe moody hoy jay thik e...\nKintu moner dik diye O khub eee bhalo...\nBaire jotoi dekhaona jor...\nBhetore totoina bhora ador❤️‍🩹😁",

  "kash amra majhe majhei dekha korte partam...\nicha chilo aki collage a porar\nbut ta r holo kothay...😢",

  "I wish tui jeno sobsomay erom chill mindfree thakis\nLoke joto baje kothai bolukna keno\ntui jemon oromi thak...\n\nTor upor eto pressure jaye majhe majhe\namar bhoy lage je tui abar change na hoy jas ei kore...\n\nBcz the thought \nof losing you scares me\nreally😭😭\n\nsorry eisob kotha lekhar jonne\njst jeta feel kori\nbollam...",


  "amader memories khub e choto but still different...\nsobai to trips r bypare etc... lekhe\namader memories sobi messages a praye....😊",

  "Unacademy kom chilona bol😂😂😜😜\namader prochur memories diyeche\nrank dik na dik😂\nder lakher r memories... ete 10g sona toiri hoy jabe\nbut amader sonar kom chilo ki?",

  "Tor mone ache? tui samne astis r ami boda hoy jetam😂😂\nsamne diye gele takatei partamna...\nOdike chat a batela marchi🤣😭",

  "tui boltis chat a joto dabi\nbaire bijhe beral😂....\nha sottie bijhe beral chilam🤣\nSamne 10meter durei dariye achis\nBon chole geche chips ante tao kotha berochenaa🤣\nektai kothaa KIREEEEE😂",

  "tor bon o janto er dara kichu hobena\nami jai chips ani🤣",

  "Oh Aryan okhan kar ek systum chilo baba re bol?\nO ak bal chilo\ntor revenge ta baki roye gelo last din r...\nbut I think its ok... kichu jinis bhalor jonnoi hoy...",
  "baki memories bolte roilo\namader late night everyday chats....\nthat I miss everydayyyy, everyday goodnights & all etc...\njai hok seta naye porer bochor hobe🤣😜\nami late-night chats r kotha bolchi😁😁😜",
  "Last meet:-11/01/2026\njotoi miss korina keno\njotoi mon kharap koruk\nbhogoban sonena",
  "ekta chotto last kobita tomar jonne...",
  
"Tomar sathe ekta misti dupur\nAmar dike agiye ashe payer nupur...\nSurjo sobar age muhurto\nBhat er pate mach ar shukto\nTomari sathe katai somoy\nJibon sundor hoye othe tomari aloy....",
];
// =======================================


// ===== FLOATING HEARTS (same as all pages) =====
const hCanvas = document.getElementById('hearts-canvas');
const hCtx    = hCanvas.getContext('2d');
let heartsArray = [];
const heartCache = [];

function resizeHCanvas() {
  hCanvas.width  = window.innerWidth;
  hCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeHCanvas);
resizeHCanvas();

function generateHeartCache() {
  const pinks = ['#ffccd5','#ffb3c1','#ff85a1','#f8bbd0','#ffe8f3'];
  for (let i = 0; i < 15; i++) {
    const cc = document.createElement('canvas');
    const cx = cc.getContext('2d');
    const size = Math.random() * 10 + 6;
    const blur = Math.random() * 3;
    const color = pinks[Math.floor(Math.random() * pinks.length)];
    const pad = blur * 3 + 12;
    cc.width = size + pad * 2; cc.height = size + pad * 2;
    cx.filter = `blur(${blur}px)`;
    cx.fillStyle = color; cx.shadowBlur = 8; cx.shadowColor = color;
    const hx = pad + size/2, hy = pad, t = size * 0.3;
    cx.beginPath();
    cx.moveTo(hx, hy+t);
    cx.bezierCurveTo(hx,hy, hx-size/2,hy, hx-size/2,hy+t);
    cx.bezierCurveTo(hx-size/2,hy+(size+t)/2, hx,hy+(size+t)/2, hx,hy+size);
    cx.bezierCurveTo(hx,hy+(size+t)/2, hx+size/2,hy+(size+t)/2, hx+size/2,hy+t);
    cx.bezierCurveTo(hx+size/2,hy, hx,hy, hx,hy+t);
    cx.closePath(); cx.fill();
    heartCache.push({ canvas: cc, width: cc.width, height: cc.height });
  }
}

class Heart {
  constructor() { this.ci = Math.floor(Math.random() * heartCache.length); this.reset(true); }
  reset(initial=false) {
    const t = heartCache[this.ci];
    this.x = Math.random() * hCanvas.width;
    this.y = initial ? Math.random() * hCanvas.height : hCanvas.height + t.height + 50;
    this.speedY = Math.random() * 0.3 + 0.2;
    this.swaySpeed = Math.random() * 0.015 + 0.005;
    this.swayOffset = Math.random() * Math.PI * 2;
    this.swayWidth = Math.random() * 0.5 + 0.2;
    this.baseOpacity = Math.random() * 0.35 + 0.1;
    this.opacity = initial ? this.baseOpacity : 0;
  }
  draw() {
    const t = heartCache[this.ci];
    hCtx.save(); hCtx.globalAlpha = Math.max(0, this.opacity);
    hCtx.drawImage(t.canvas, this.x - t.width/2, this.y - t.height/2);
    hCtx.restore();
  }
  update() {
    this.y -= this.speedY;
    this.swayOffset += this.swaySpeed;
    this.x += Math.sin(this.swayOffset) * this.swayWidth;
    const fd = 150;
    let target = this.baseOpacity;
    if (this.y < fd) target = this.baseOpacity * (this.y / fd);
    else if (hCanvas.height - this.y < fd) target = this.baseOpacity * ((hCanvas.height - this.y) / fd);
    this.opacity += (target - this.opacity) * 0.05;
    if (this.y < -50) this.reset(false);
  }
}

generateHeartCache();
function initHearts() {
  heartsArray = [];
  const n = window.innerWidth < 480 ? 10 : 18;
  for (let i = 0; i < n; i++) heartsArray.push(new Heart());
}
let _lastHeartTs = 0;
const _HEART_INTERVAL = IS_MOBILE ? 42 : 0; // ~24 fps on mobile, uncapped on desktop

function animateHearts(ts = 0) {
  requestAnimationFrame(animateHearts);
  if (_HEART_INTERVAL > 0 && ts - _lastHeartTs < _HEART_INTERVAL) return;
  _lastHeartTs = ts;
  hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height);
  heartsArray.forEach(h => { h.update(); h.draw(); });
}
initHearts();
animateHearts();


// ===== FIREFLIES FLYING INSIDE JAR =====
const fCanvas = document.getElementById('fairyCanvas');
const fCtx    = fCanvas.getContext('2d');

function resizeFairy() {
  const scene = document.querySelector('.jar-scene');
  fCanvas.width  = scene.offsetWidth;
  fCanvas.height = scene.offsetHeight;
}
resizeFairy();
window.addEventListener('resize', resizeFairy);

// Interior "flight zone" — an ellipse matching the jar's glass body
// (relative to canvas size, which matches the jar SVG's viewBox proportions)
const FLIGHT_ZONE = { cx: 0.5, cy: 0.64, rx: 0.34, ry: 0.30 };


const FIREFLY_COLORS = ['#ffd080', '#ffb060', '#ffe0a0', '#ffc060', '#fff0c0'];

class Firefly {
  constructor() {
    // random starting point inside the flight zone
    const start = this.randomPointInZone();
    this.x = start.x;
    this.y = start.y;
    this.target = this.randomPointInZone();
    this.speed = Math.random() * 0.55 + 0.25;
    this.baseR = Math.random() * 2.2 + 1.6;
    this.color = FIREFLY_COLORS[Math.floor(Math.random() * FIREFLY_COLORS.length)];
    this.phase = Math.random() * Math.PI * 2;
    this.flickerSpeed = Math.random() * 0.05 + 0.025;
    this.trail = [];
    this.maxTrail = IS_MOBILE ? 3 : 6;
    // small wobble so flight paths feel organic, not robotic
    this.wobbleOffset = Math.random() * Math.PI * 2;
    this.wobbleSpeed = Math.random() * 0.04 + 0.02;
    this.wobbleAmount = Math.random() * 0.6 + 0.3;

    // Pre-bake glow onto a tiny offscreen canvas — created ONCE, stamped via
    // drawImage every frame. Avoids createRadialGradient per frame (the main bottleneck).
    this.glowSprite = this._buildGlowSprite();
  }

  _buildGlowSprite() {
    const maxR  = this.baseR * 1.3;      // peak glow-core radius (brightness = 1)
    const glowR = maxR * 5;              // halo radius — matches r*5 in the original draw
    const size  = Math.ceil(glowR * 2) + 4;
    const cc    = document.createElement('canvas');
    cc.width = cc.height = size;
    const ctx = cc.getContext('2d');
    const cx  = size / 2;
    const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, glowR);
    grad.addColorStop(0, 'rgba(255,220,150,1)');
    grad.addColorStop(1, 'rgba(255,180,60,0)');
    ctx.beginPath();
    ctx.arc(cx, cx, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    return cc;
  }

  randomPointInZone() {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()); // even distribution within ellipse
    return {
      x: (FLIGHT_ZONE.cx + Math.cos(angle) * FLIGHT_ZONE.rx * r * 0.9) * fCanvas.width,
      y: (FLIGHT_ZONE.cy + Math.sin(angle) * FLIGHT_ZONE.ry * r * 0.9) * fCanvas.height,
    };

  }

  update() {
    // steer toward target
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 4) {
      this.target = this.randomPointInZone();
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }

    // gentle organic wobble perpendicular to motion
    this.wobbleOffset += this.wobbleSpeed;
    this.x += Math.sin(this.wobbleOffset) * this.wobbleAmount * 0.3;
    this.y += Math.cos(this.wobbleOffset * 0.7) * this.wobbleAmount * 0.3;

    // flicker
    this.phase += this.flickerSpeed;

    // record trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrail) this.trail.shift();
  }

  draw() {
    const brightness = (Math.sin(this.phase) + 1) / 2; // 0–1
    const r     = this.baseR * (0.6 + brightness * 0.7);
    const alpha = 0.35 + brightness * 0.6;

    // Trail dots
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const trailAlpha = (i / this.trail.length) * alpha * 0.35;
      const trailR = r * (0.4 + (i / this.trail.length) * 0.5);
      fCtx.beginPath();
      fCtx.arc(t.x, t.y, trailR, 0, Math.PI * 2);
      fCtx.fillStyle = `rgba(255,210,140,${trailAlpha})`;
      fCtx.fill();
    }

    // Glow halo — stamp pre-baked sprite (cheap drawImage, not createRadialGradient)
    // globalAlpha drives the flicker; the sprite was baked at full brightness.
    const hw = this.glowSprite.width / 2;
    fCtx.globalAlpha = alpha;
    fCtx.drawImage(this.glowSprite, this.x - hw, this.y - hw);
    fCtx.globalAlpha = 1;

    // Bright core
    fCtx.beginPath();
    fCtx.arc(this.x, this.y, r, 0, Math.PI * 2);
    fCtx.fillStyle = `rgba(255,245,210,${0.7 + brightness * 0.3})`;
    fCtx.fill();
  }
}

const fireflies = [];
function initFireflies() {
  fireflies.length = 0;
  const count = IS_MOBILE ? 8 : 12;
  for (let i = 0; i < count; i++) fireflies.push(new Firefly());
}
initFireflies();
window.addEventListener('resize', initFireflies);

let _lastFairyTs = 0;
const _FAIRY_INTERVAL = IS_MOBILE ? 33 : 0; // ~30 fps on mobile, uncapped on desktop

function animateFairy(ts = 0) {
  requestAnimationFrame(animateFairy);
  if (_FAIRY_INTERVAL > 0 && ts - _lastFairyTs < _FAIRY_INTERVAL) return;
  _lastFairyTs = ts;
  fCtx.clearRect(0, 0, fCanvas.width, fCanvas.height);
  fireflies.forEach(f => { f.update(); f.draw(); });
}
animateFairy();



// ===== JAR TAP LOGIC =====
let tapCount   = 0;
let jarOpen    = false;
const jarScene = document.getElementById('jarScene');
const jarSvgEl = document.getElementById('jarSvg');
const jarLid   = document.getElementById('jarLid');
const tapHint  = document.getElementById('tapHint');
const tapDots  = document.querySelectorAll('.tap-dot');
const tapDotsWrap = document.getElementById('tapDots');
const actionArea = document.getElementById('actionArea');

jarScene.addEventListener('click', (e) => {
  // ── Once the jar is open, tapping anywhere on the jar pulls out a note ──
  // (individual ball taps still work too — this is the reliable fallback,
  //  since the balls are small and easy to miss on mobile)
  if (jarOpen) {
    const rect = jarScene.getBoundingClientRect();
    const x = (e.clientX ?? rect.left + rect.width/2) - rect.left;
    const y = (e.clientY ?? rect.top + rect.height/2) - rect.top;
    spawnTapRipple(x, y);
    spawnTapParticles(x, y, 7);
    pickNextChit();
    return;
  }

  window.BirthdaySound?.play('glassTap');

  tapCount++;

  // light up dot with pop
  if (tapCount <= 3) {
    const dot = tapDots[tapCount - 1];
    dot.classList.add('lit', 'pop');
    dot.addEventListener('animationend', () => dot.classList.remove('pop'), { once: true });
  }

  // hide hint after first tap
  if (tapCount === 1) {
    tapHint.classList.add('hidden');
  }

  // ── PLAYFUL TAP FEEDBACK ──
  // 1. bounce (squash & stretch)
  jarSvgEl.style.animation = 'none';
  void jarSvgEl.offsetWidth; // reflow to restart
  jarSvgEl.style.animation = 'tapBounce 0.45s ease';
  setTimeout(() => { jarSvgEl.style.animation = ''; }, 450); // back to jarFloat

  // 2. warm glow flash
  jarSvgEl.classList.add('tap-glow');
  setTimeout(() => jarSvgEl.classList.remove('tap-glow'), 220);

  // 3. ripple ring + sparkle/heart burst from tap point
  const rect = jarScene.getBoundingClientRect();
  const x = (e.clientX ?? rect.left + rect.width/2) - rect.left;
  const y = (e.clientY ?? rect.top + rect.height/2) - rect.top;
  spawnTapRipple(x, y);
  spawnTapParticles(x, y, tapCount === 3 ? 16 : 9);

  if (tapCount === 3) {
    openJar();
  }
});

// expanding ring at tap point
function spawnTapRipple(x, y) {
  const ring = document.createElement('div');
  ring.className = 'tap-ring';
  ring.style.left = x + 'px';
  ring.style.top  = y + 'px';
  jarScene.appendChild(ring);
  ring.addEventListener('animationend', () => ring.remove(), { once: true });
}

// little hearts/sparkles flying outward from tap point
const TAP_PARTICLE_GLYPHS = ['✦', '♡', '✧', '·', '✨'];
const TAP_PARTICLE_COLORS = ['#ffd080', '#ff9ec4', '#fff0c0', '#ffb6d0', '#ffe8a3'];

function spawnTapParticles(x, y, count = 9) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'tap-particle';
    p.textContent = TAP_PARTICLE_GLYPHS[Math.floor(Math.random() * TAP_PARTICLE_GLYPHS.length)];
    p.style.color = TAP_PARTICLE_COLORS[Math.floor(Math.random() * TAP_PARTICLE_COLORS.length)];

    const angle = Math.random() * Math.PI * 2;
    const dist  = 35 + Math.random() * 55;
    p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    p.style.left = x + 'px';
    p.style.top  = y + 'px';
    p.style.animationDelay = (Math.random() * 0.08) + 's';

    jarScene.appendChild(p);
    p.addEventListener('animationend', () => p.remove(), { once: true });
  }
}

function openJar(options = {}) {
  if (jarOpen) return;
  if (!options.restored) window.BirthdaySound?.play('lidPop');
  jarOpen = true;
  tapCount = 3;
  tapHint.classList.add('hidden');
  if (tapDotsWrap) tapDotsWrap.classList.add('hidden');
  persistJarState();

  // pop lid off
  jarLid.classList.add('open');

  // extra celebratory burst from the lid area when it pops
  const rect = jarScene.getBoundingClientRect();
  if (!options.restored) {
    setTimeout(() => {
      spawnTapParticles(rect.width * 0.5, rect.height * 0.12, 14);
    }, 150);
  }

  // show action area
  setTimeout(() => {
    actionArea.classList.add('visible');
  }, options.restored ? 0 : 700);

  // the wrapped paper balls inside the jar become directly tappable —
  // reach in and pick a note
  for (let i = 0; i < CHIT_MESSAGES.length; i++) {
    const ball = document.getElementById('jarBall' + i);
    if (!ball) continue;
    ball.classList.add('interactive');
    ball.addEventListener('click', (e) => {
      e.stopPropagation();
      pickNextChit();
    });
  }
}

// Picks the next unread chit in order, so each note appears once before completion.
function getNextSequentialChitIndex() {
  if (CHIT_MESSAGES.length === 0) return null;

  if (takenChits.size < CHIT_MESSAGES.length) {
    for (let offset = 0; offset < CHIT_MESSAGES.length; offset++) {
      const index = (nextChitIndex + offset) % CHIT_MESSAGES.length;
      if (!takenChits.has(index)) return index;
    }
  }

  return nextChitIndex % CHIT_MESSAGES.length;
}

function pickNextChit() {
  if (chitBusy || activeChitIndex !== null) return;

  const index = getNextSequentialChitIndex();
  if (index === null) return;

  nextChitIndex = (index + 1) % CHIT_MESSAGES.length;
  persistJarState();
  takeChit(index);
}


// ===== CHIT LOGIC =====
let readCount = 0;
let hasReadOnce = false; // true after first full read; switches popup → continue button on second read
let nextChitIndex = 0;
let takenChits = new Set(); // tracks which have been read (for all-read check)
const readCounter = document.getElementById('readCounter');
const jarCompletedHint = document.getElementById('jarCompletedHint');

const chitModal = document.getElementById('chitModal');
const chitPaper = document.getElementById('chitPaper');
const chitMsgEl = document.getElementById('chitMessage');

let activeChitIndex = null; // which chit is currently open
let chitBusy = false;       // prevents double-taps during animation

function takeChit(index) {
  if (chitBusy || activeChitIndex !== null) return;
  window.BirthdaySound?.play('paperOpen');
  chitBusy = true;
  activeChitIndex = index;

  const jarBall = document.getElementById('jarBall' + index);

  // ── 2. The selected chit ball subtly highlights ──
  jarBall.classList.add('selected');
  jarBall.addEventListener('animationend', () => jarBall.classList.remove('selected'), { once: true });

  // ── 3. The jar lid lifts slightly, as if allowing the note to escape ──
  jarLid.classList.add('lifting');

  // Compute the ball's position relative to viewport center, so the paper
  // appears to rise out of the jar and fly to the center from this exact spot.
  const rect = jarBall.getBoundingClientRect();
  const ballCenterX = rect.left + rect.width / 2;
  const ballCenterY = rect.top + rect.height / 2;
  const viewportCenterX = window.innerWidth / 2;
  const viewportCenterY = window.innerHeight / 2;

  const flyX = ballCenterX - viewportCenterX;
  const flyY = (ballCenterY - viewportCenterY) - 30; // slight "rise" before flying in

  chitPaper.style.setProperty('--fly-x', flyX + 'px');
  chitPaper.style.setProperty('--fly-y', flyY + 'px');

  // set message content before opening
  chitMsgEl.innerHTML = CHIT_MESSAGES[index].replace(/\n/g, '<br>');

  // ── 4. The chit ball rises naturally from inside the jar ── (fades/shrinks in place)
  // ── 5. The existing unwrap animation plays ── (fold overlay fades, paper flies in)
  setTimeout(() => {
    jarBall.classList.add('taken');

    chitModal.classList.add('open');
    chitPaper.classList.add('paper-glow');
    setTimeout(() => chitPaper.classList.remove('paper-glow'), 350);

    // ── 6. The message is displayed ── (inner fade-in via CSS transition-delay)
    chitBusy = false;
  }, 280);
}

function closeChit() {
  if (chitBusy) return;
  window.BirthdaySound?.play('paperClose');
  const index = activeChitIndex;
  if (index === null) return;
  chitBusy = true;

  const jarBall = document.getElementById('jarBall' + index);

  // message fades out quickly
  chitModal.classList.add('closing');

  // mark as read (for counter) — only the first time
  if (!takenChits.has(index)) {
    takenChits.add(index);
    readCount++;
    updateCounter();
    persistJarState();
  }

  setTimeout(() => {
    // ── 7. The chit gracefully folds back into a wrapped ball ── (fold overlay returns, paper flies back)
    chitModal.classList.remove('open');

    // ── 8. The wrapped ball gently returns to the jar ──
    setTimeout(() => {
      chitModal.classList.remove('closing');

      // restore the ball inside the jar — jar feels full again
      jarBall.classList.remove('taken');

      // ── 9. The lid settles back into its resting position ──
      jarLid.classList.remove('lifting');

      activeChitIndex = null;
      chitBusy = false;

      // ── check if all notes have been read ──
      if (takenChits.size === CHIT_MESSAGES.length) {
        setTimeout(() => {
          if (hasReadOnce) {
            showContinueButton(); // second time: quiet continue button, no popup
          } else {
            document.getElementById('allReadOverlay').classList.add('open'); // first time: popup
          }
        }, 500);
      }
    }, 620); // matches the paper's fly-back transition duration
  }, 200); // matches the inner content's fast fade-out
}

function updateCounter() {
  readCounter.textContent = `${readCount} of ${CHIT_MESSAGES.length} notes read ♡`;
}

// ===== ALL READ OVERLAY =====
function resetAndReadAgain() {
  hasReadOnce = true;

  // Reset in-memory tracking — the old closeAllRead() skipped this,
  // leaving takenChits full so the popup fired again after just one note.
  takenChits     = new Set();
  readCount      = 0;
  nextChitIndex  = 0;
  updateCounter();

  // Restore all ball visuals so the jar looks full again
  for (let i = 0; i < CHIT_MESSAGES.length; i++) {
    const ball = document.getElementById('jarBall' + i);
    if (ball) ball.classList.remove('taken');
  }

  document.getElementById('allReadOverlay').classList.remove('open');
  persistJarState();
}

function goNext() {
  // ADDED: Tell the dark overlay to smoothly fade out
  document.getElementById('allReadOverlay').classList.remove('open');
  
  JourneyNav.setState({ reachedStory: true });
  JourneyNav.goTo('story.html', '.jar-page');
}

function showContinueButton() {
  // Guard — don't create it twice
  if (document.getElementById('secondReadContinueBtn')) return;

  const btn = document.createElement('button');
  btn.id  = 'secondReadContinueBtn';
  btn.textContent = 'Continue ♡';

  // Glass style matching the rest of the site — no jar.css change needed
  Object.assign(btn.style, {
    display:          'block',
    margin:           '1.2rem auto 0',
    padding:          '0.75rem 2rem',
    fontFamily:       "'Playfair Display', serif",
    fontStyle:        'italic',
    fontSize:         '1rem',
    color:            '#ffe8f3',
    letterSpacing:    '0.06em',
    background:       'rgba(255,200,220,0.08)',
    backdropFilter:   'blur(14px)',
    webkitBackdropFilter: 'blur(14px)',
    border:           '1.5px solid rgba(230,170,150,0.45)',
    borderRadius:     '50px',
    cursor:           'pointer',
    boxShadow:        '0 8px 28px rgba(120,10,60,0.4),inset 0 1px 0 rgba(255,225,215,0.25)',
    opacity:          '0',
    transform:        'translateY(10px)',
    transition:       'opacity 0.8s ease, transform 0.8s ease',
  });

  btn.onclick = goNext;

  // Insert right after the read counter
  document.getElementById('readCounter').insertAdjacentElement('afterend', btn);

  // Trigger the fade-in on next paint
  requestAnimationFrame(() => requestAnimationFrame(() => {
    btn.style.opacity   = '1';
    btn.style.transform = 'translateY(0)';
  }));
}

function restoreJarState() {
  const saved = JourneyNav.getState();
  const savedTaken = Array.isArray(saved.jarTakenChits) ? saved.jarTakenChits : [];

  takenChits = new Set(savedTaken.filter(index => index >= 0 && index < CHIT_MESSAGES.length));
  readCount = takenChits.size;
  nextChitIndex = Number.isInteger(saved.jarNextChitIndex)
    ? saved.jarNextChitIndex % CHIT_MESSAGES.length
    : readCount % CHIT_MESSAGES.length;
  updateCounter();

  if (saved.jarOpen || saved.jarAllRead) {
    tapCount = 3;
    tapDots.forEach(dot => dot.classList.add('lit'));
    tapHint.classList.add('hidden');
    if (tapDotsWrap) tapDotsWrap.classList.add('hidden');
    openJar({ restored: true });
  }

  if (takenChits.size === CHIT_MESSAGES.length) {
    JourneyNav.setState({ jarAllRead: true });
    if (jarCompletedHint) jarCompletedHint.classList.add('visible');
    document.getElementById('allReadOverlay').classList.add('open');
  }
}

restoreJarState();