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


JourneyNav.setState({ reachedPoem: true });
JourneyNav.renderBackButton('index.html#interlude');

function goToJar() {
  JourneyNav.setState({ reachedMemories: true });
  JourneyNav.goTo('memories.html', '#poemPage');
}
// ============================================
//   POEM PAGE — poem.js
// ============================================


// ===== 1. FLOATING HEARTS (same as opening page) =====
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
  const pinks = ['#ffccd5', '#ffb3c1', '#ff85a1', '#f8bbd0', '#ffe8f3'];
  for (let i = 0; i < 15; i++) {
    const cc  = document.createElement('canvas');
    const cctx = cc.getContext('2d');
    const size = Math.random() * 10 + 6;
    const blur = Math.random() * 3;
    const color = pinks[Math.floor(Math.random() * pinks.length)];
    const pad  = blur * 3 + 12;
    cc.width  = size + pad * 2;
    cc.height = size + pad * 2;
    cctx.filter = `blur(${blur}px)`;
    cctx.fillStyle = color;
    cctx.shadowBlur = 8;
    cctx.shadowColor = color;
    const cx = pad + size / 2, cy = pad, t = size * 0.3;
    cctx.beginPath();
    cctx.moveTo(cx, cy + t);
    cctx.bezierCurveTo(cx, cy, cx - size/2, cy, cx - size/2, cy + t);
    cctx.bezierCurveTo(cx - size/2, cy + (size+t)/2, cx, cy + (size+t)/2, cx, cy + size);
    cctx.bezierCurveTo(cx, cy + (size+t)/2, cx + size/2, cy + (size+t)/2, cx + size/2, cy + t);
    cctx.bezierCurveTo(cx + size/2, cy, cx, cy, cx, cy + t);
    cctx.closePath();
    cctx.fill();
    heartCache.push({ canvas: cc, width: cc.width, height: cc.height });
  }
}

class Heart {
  constructor() {
    this.ci = Math.floor(Math.random() * heartCache.length);
    this.reset(true);
  }
  reset(initial = false) {
    const t = heartCache[this.ci];
    this.x = Math.random() * hCanvas.width;
    this.y = initial ? Math.random() * hCanvas.height : hCanvas.height + t.height + 50;
    this.speedY = Math.random() * 0.3 + 0.2;
    this.swaySpeed  = Math.random() * 0.015 + 0.005;
    this.swayOffset = Math.random() * Math.PI * 2;
    this.swayWidth  = Math.random() * 0.5 + 0.2;
    this.baseOpacity = Math.random() * 0.35 + 0.1;
    this.opacity = initial ? this.baseOpacity : 0;
  }
  draw() {
    const t = heartCache[this.ci];
    hCtx.save();
    hCtx.globalAlpha = Math.max(0, this.opacity);
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
function animateHearts() {
  hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height);
  heartsArray.forEach(h => { h.update(); h.draw(); });
  requestAnimationFrame(animateHearts);
}
initHearts();
animateHearts();


// ===== 2. FLOATING PETALS =====
const pCanvas = document.getElementById('petals-canvas');
const pCtx    = pCanvas.getContext('2d');
let petals    = [];
const petalCache = [];

function resizePCanvas() {
  pCanvas.width  = window.innerWidth;
  pCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizePCanvas);
resizePCanvas();

// pre-render petal shapes
function generatePetalCache() {
  const colors = ['#e8a0b8', '#f0c0d0', '#d87098', '#f5d0e0', '#c86080', '#fce0ec'];
  for (let i = 0; i < 12; i++) {
    const cc   = document.createElement('canvas');
    const cctx = cc.getContext('2d');
    const w = Math.random() * 10 + 7;
    const h = w * (0.5 + Math.random() * 0.4);
    const color = colors[Math.floor(Math.random() * colors.length)];
    cc.width  = w + 6;
    cc.height = h + 6;
    cctx.filter = 'blur(0.6px)';
    cctx.fillStyle = color;
    cctx.globalAlpha = 0.85;
    // petal shape — simple ellipse rotated
    cctx.save();
    cctx.translate(cc.width/2, cc.height/2);
    cctx.beginPath();
    cctx.ellipse(0, 0, w/2, h/2, 0, 0, Math.PI * 2);
    cctx.fill();
    cctx.restore();
    petalCache.push({ canvas: cc, w: cc.width, h: cc.height });
  }
}

class Petal {
  constructor(initial = false) {
    this.ci = Math.floor(Math.random() * petalCache.length);
    this.x  = Math.random() * pCanvas.width;
    this.y  = initial ? Math.random() * pCanvas.height : -20;
    this.speedY  = Math.random() * 0.6 + 0.3;
    this.speedX  = (Math.random() - 0.5) * 0.5;
    this.rotation    = Math.random() * Math.PI * 2;
    this.rotSpeed    = (Math.random() - 0.5) * 0.02;
    this.swayOffset  = Math.random() * Math.PI * 2;
    this.swaySpeed   = Math.random() * 0.012 + 0.005;
    this.opacity     = Math.random() * 0.45 + 0.2;
    this.baseOpacity = this.opacity;
  }
  update() {
    this.y += this.speedY;
    this.swayOffset += this.swaySpeed;
    this.x += this.speedX + Math.sin(this.swayOffset) * 0.6;
    this.rotation += this.rotSpeed;
    if (this.y > pCanvas.height + 20) {
      this.y = -20;
      this.x = Math.random() * pCanvas.width;
    }
  }
  draw() {
    const t = petalCache[this.ci];
    pCtx.save();
    pCtx.globalAlpha = this.opacity;
    pCtx.translate(this.x, this.y);
    pCtx.rotate(this.rotation);
    pCtx.drawImage(t.canvas, -t.w/2, -t.h/2);
    pCtx.restore();
  }
}

generatePetalCache();
function initPetals() {
  petals = [];
  const n = window.innerWidth < 480 ? 14 : 26;
  for (let i = 0; i < n; i++) petals.push(new Petal(true));
}
function animatePetals() {
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  petals.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animatePetals);
}
initPetals();
animatePetals();


// ===== 3. TYPEWRITER EFFECT =====
// Reveals each .poem-line one at a time, character by character.
// poem-gap lines are shown instantly (they're just spacing).

const lines  = document.querySelectorAll('.poem-line');
const cursor = document.getElementById('typeCursor');

// delay before typing starts (ms)
const START_DELAY    = 800;
// pause between lines (ms)
const LINE_PAUSE     = 280;
// typing speed — lower = faster (ms per character)
const CHAR_SPEED     = 70;
// pause after a stanza gap line
const GAP_PAUSE      = 420;

let lineIndex = 0;

function typeNextLine() {
  if (lineIndex >= lines.length) {
    JourneyNav.setState({ poemTyped: true }); // ← add this line
    // all done — hide cursor after a beat, then let the memories gather in.
    setTimeout(() => cursor.classList.add('hidden'), 1200);
    setTimeout(() => document.getElementById('poemPage')?.classList.add('poem-finished'), 700);
    
    // ADDED: Reveal the Continue button after the typing sequence is fully complete
    setTimeout(() => {
      const nextWrap = document.querySelector('.poem-next-wrap');
      if (nextWrap) nextWrap.classList.add('visible');
    }, 1500);

    return;
  }

  // ... (keep the rest of your typing logic exactly the same)

  const line = lines[lineIndex];
  lineIndex++;

  // gap lines — just show instantly and move on
  if (line.classList.contains('poem-gap')) {
    line.classList.add('visible');
    setTimeout(typeNextLine, GAP_PAUSE);
    return;
  }

  const fullText = line.textContent.trim();
  line.textContent = '';
  line.classList.add('visible');

  let charIndex = 0;

  function typeChar() {
    if (charIndex < fullText.length) {
      line.textContent += fullText[charIndex];
      charIndex++;
      setTimeout(typeChar, CHAR_SPEED);
    } else {
      // line done — pause then start next
      setTimeout(typeNextLine, LINE_PAUSE);
    }
  }

  typeChar();
}

// kick off after page load
// ── On revisit: skip animation, show everything immediately ──
const _saved = JourneyNav.getState();
if (_saved.poemTyped) {
  // show all lines instantly
  lines.forEach(line => {
    if (!line.classList.contains('poem-gap')) {
      line.textContent = line.textContent.trim() || line.dataset.full || line.textContent;
    }
    line.classList.add('visible');
  });
  cursor.classList.add('hidden');
  document.getElementById('poemPage')?.classList.add('poem-finished');
  const nextWrap = document.querySelector('.poem-next-wrap');
  if (nextWrap) nextWrap.classList.add('visible');
} else {
  // first visit — run the typewriter normally
  setTimeout(typeNextLine, START_DELAY);
}

