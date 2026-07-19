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


let interludeBackBtn = null;

function removeInterludeBackButton() {
  if (!interludeBackBtn) return;
  interludeBackBtn.remove();
  interludeBackBtn = null;
}

function renderInterludeBackButton() {
  if (interludeBackBtn) return;
  interludeBackBtn = JourneyNav.renderBackButton('index.html#password', () => {
    const interlude = document.getElementById('interlude-screen');
    const nextScreen = document.getElementById('next-screen');
    interlude.classList.add('page-exit');
    setTimeout(() => {
      interlude.classList.remove('visible', 'fade-out', 'page-root', 'page-exit');
      nextScreen.style.display = 'flex';
      nextScreen.classList.remove('phone-unlock');
      nextScreen.classList.add('visible');
      removeInterludeBackButton();
    }, JourneyNav.TRANSITION_MS);
  });
}
// ===== FLOATING HEARTS CANVAS (FIREFLY BOKEH) =====
const canvas = document.getElementById('hearts-canvas');
const ctx = canvas.getContext('2d');

let heartsArray = [];
const heartCache = []; 

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function generateHeartCache() {
    const pinks = ['#ffccd5', '#ffb3c1', '#ff85a1', '#f8bbd0', '#ffe8f3'];
    for (let i = 0; i < 15; i++) {
        const cacheCanvas = document.createElement('canvas');
        const cacheCtx = cacheCanvas.getContext('2d');
        const size = Math.random() * 10 + 6; // Refined, smaller sizing
        const blurAmount = Math.random() * 3; 
        const color = pinks[Math.floor(Math.random() * pinks.length)];
        const padding = blurAmount * 3 + 12;
        cacheCanvas.width = size + padding * 2;
        cacheCanvas.height = size + padding * 2;
        
        cacheCtx.filter = `blur(${blurAmount}px)`;
        cacheCtx.fillStyle = color;
        cacheCtx.shadowBlur = 8;
        cacheCtx.shadowColor = color;
        
        const cx = padding + size / 2;
        const cy = padding;
        const topCurveHeight = size * 0.3;
        
        cacheCtx.beginPath();
        cacheCtx.moveTo(cx, cy + topCurveHeight);
        cacheCtx.bezierCurveTo(cx, cy, cx - size / 2, cy, cx - size / 2, cy + topCurveHeight);
        cacheCtx.bezierCurveTo(cx - size / 2, cy + (size + topCurveHeight) / 2, cx, cy + (size + topCurveHeight) / 2, cx, cy + size);
        cacheCtx.bezierCurveTo(cx, cy + (size + topCurveHeight) / 2, cx + size / 2, cy + (size + topCurveHeight) / 2, cx + size / 2, cy + topCurveHeight);
        cacheCtx.bezierCurveTo(cx + size / 2, cy, cx, cy, cx, cy + topCurveHeight);
        cacheCtx.closePath();
        cacheCtx.fill();
        
        heartCache.push({ canvas: cacheCanvas, width: cacheCanvas.width, height: cacheCanvas.height });
    }
}

class Heart {
    constructor() {
        this.cacheIndex = Math.floor(Math.random() * heartCache.length);
        this.reset(true); 
    }

    reset(initial = false) {
        const texture = heartCache[this.cacheIndex];
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height : canvas.height + texture.height + 50;
        
        this.speedY = Math.random() * 0.3 + 0.2; 
        
        // Firefly swaying mechanics
        this.swaySpeed = Math.random() * 0.015 + 0.005;
        this.swayOffset = Math.random() * Math.PI * 2;
        this.swayWidth = Math.random() * 0.5 + 0.2; 

        this.baseOpacity = Math.random() * 0.4 + 0.15;
        this.opacity = initial ? this.baseOpacity : 0; 
    }

    draw() {
        const texture = heartCache[this.cacheIndex];
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.drawImage(texture.canvas, this.x - texture.width / 2, this.y - texture.height / 2);
        ctx.restore();
    }

    update() {
        this.y -= this.speedY;
        
        // Elegant side-to-side firefly drift
        this.swayOffset += this.swaySpeed;
        this.x += Math.sin(this.swayOffset) * this.swayWidth;

        // Smooth fade in from bottom, fade out at top
        const fadeDistance = 150;
        let targetOpacity = this.baseOpacity;
        
        if (this.y < fadeDistance) {
            targetOpacity = this.baseOpacity * (this.y / fadeDistance); 
        } else if (canvas.height - this.y < fadeDistance) {
            targetOpacity = this.baseOpacity * ((canvas.height - this.y) / fadeDistance); 
        }
        
        this.opacity += (targetOpacity - this.opacity) * 0.05;

        if (this.y < -50) {
            this.reset(false);
        }
    }
}

generateHeartCache(); 

function initHearts() {
    heartsArray = [];
    const numberOfHearts = window.innerWidth < 480 ? 10 : 25; // Reduced quantity for elegance
    for (let i = 0; i < numberOfHearts; i++) {
        heartsArray.push(new Heart());
    }
}

function animateHearts() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < heartsArray.length; i++) {
        heartsArray[i].update();
        heartsArray[i].draw();
    }
    requestAnimationFrame(animateHearts);
}

initHearts();
animateHearts();



// ===== CINEMATIC OPENING SEQUENCE =====
let entranceReady = false;

function spawnArrivalParticles() {
  const giftScene = document.getElementById('giftScene');
  if (!giftScene) return;

  const glyphs = ['♡', '♥', '✦', '·'];
  for (let i = 0; i < 12; i++) {
    const particle = document.createElement('span');
    particle.className = 'arrival-particle';
    particle.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    const angle = Math.random() * Math.PI * 2;
    const distance = 28 + Math.random() * 46;
    particle.style.setProperty('--dx', Math.cos(angle) * distance + 'px');
    particle.style.setProperty('--dy', Math.sin(angle) * distance - 34 + 'px');
    particle.style.animationDelay = Math.random() * 0.12 + 's';
    giftScene.appendChild(particle);
    particle.addEventListener('animationend', () => particle.remove(), { once: true });
  }
}

function finishOpeningArrival() {
  window.BirthdaySound?.play('giftLand');
  document.body.classList.remove('entrance-running', 'entrance-shake');
  document.body.classList.add('entrance-ready');
  entranceReady = true;
}

function runOpeningSequence() {
  const loadingScreen = document.getElementById('loading-screen');

  if (window.location.hash === '#interlude') {
    document.body.classList.remove('entrance-pending', 'entrance-running');
    document.body.classList.add('entrance-ready');
    if (loadingScreen) loadingScreen.style.display = 'none';
    entranceReady = true;
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    if (loadingScreen) loadingScreen.classList.add('fade-away');
    setTimeout(() => {
      if (loadingScreen) loadingScreen.style.display = 'none';
      document.body.classList.remove('entrance-pending');
      finishOpeningArrival();
    }, 500);
    return;
  }

  setTimeout(() => {
    if (loadingScreen) loadingScreen.classList.add('fade-away');

    setTimeout(() => {
      if (loadingScreen) loadingScreen.style.display = 'none';
      document.body.classList.remove('entrance-pending');
      document.body.classList.add('entrance-running');

      setTimeout(() => {
        document.body.classList.add('entrance-shake');
        spawnArrivalParticles();
      }, 780);

      setTimeout(() => {
        finishOpeningArrival();
      }, 2200);
    }, 650);
  }, 2200);
}

runOpeningSequence();

// ===== UX NAVIGATION: OPEN, BACK & GESTURES =====
let isOpened = false;

function openGift() {
    if (!entranceReady || isOpened) return; 
    window.BirthdaySound?.play('giftOpen');
    isOpened = true;

    JourneyNav.setState({ reachedPassword: true });

    // Push state to browser history to enable back navigation
    history.pushState({ screen: 'password' }, '', '#password');

    const gift3d = document.getElementById('gift3d');
    const lid = document.getElementById('lid');
    const openingScreen = document.getElementById('opening-screen');
    const nextScreen = document.getElementById('next-screen');

    gift3d.classList.add('opening');
    lid.classList.add('fly-off');

    setTimeout(() => {
        openingScreen.classList.add('fade-out');
        setTimeout(() => {
            openingScreen.style.display = 'none'; 
            nextScreen.classList.add('visible');
            const firstInput = document.querySelector('.pin-input');
            if(firstInput) firstInput.focus();
        }, JourneyNav.TRANSITION_MS);
    }, JourneyNav.TRANSITION_MS); 
}

// Handle Browser Back Button
window.addEventListener('popstate', (e) => {
    if (isOpened) {
        closeGift();
    }
});

// Reversal animation logic
function closeGift() {
    isOpened = false;
    const gift3d = document.getElementById('gift3d');
    const lid = document.getElementById('lid');
    const openingScreen = document.getElementById('opening-screen');
    const nextScreen = document.getElementById('next-screen');

    nextScreen.classList.remove('visible');
    openingScreen.style.display = 'flex'; 
    
    setTimeout(() => {
        openingScreen.classList.remove('fade-out');
        gift3d.classList.remove('opening');
        lid.classList.remove('fly-off');
    }, 50); 
}

// Touch Gestures: Swipe Right to go Back
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', e => {
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    
    if (touchEndX - touchStartX > 80 && Math.abs(touchEndY - touchStartY) < 60) {
        if (isOpened) {
            history.back(); 
        }
    }
}, { passive: true });


// ===== PIN INPUT LOGIC =====
const pinInputs = document.querySelectorAll('.pin-input');
pinInputs.forEach((input, index) => {
    input.addEventListener('input', () => {
        if (input.value.length === 1 && index < pinInputs.length - 1) {
            pinInputs[index + 1].focus();
        }
    });
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
            pinInputs[index - 1].focus();
        }
    });
});

// ============================================
//   PASSWORD PAGE — KEYPAD LOGIC
// ============================================

const CORRECT_PIN = '19012025';
const CORRECT_PIN2 = '22082007'; // ← SET YOUR DATE HERE e.g. '15062003'
let pinLocked  = false;
let currentPin = '';

// ── Update dot indicators ──
function updateIndicators() {
  for (let i = 0; i < 8; i++) {
    const dot = document.getElementById('ind-' + i);
    if (!dot) continue;
    if (i < currentPin.length) {
      if (!dot.classList.contains('filled')) {
        dot.classList.add('filled');
        dot.classList.remove('pop');
        void dot.offsetWidth; // restart animation
        dot.classList.add('pop');
      }
    } else {
      dot.classList.remove('filled', 'pop');
    }
  }
}

// ── Press a number key ──
function pressKey(btn) {
  if (pinLocked || currentPin.length >= 8) return;

  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 130);
  spawnRipple(btn);
  spawnKeyParticles(btn);

  document.getElementById('wrongMsg').classList.remove('show');
  document.getElementById('successMsg').classList.remove('show');

  currentPin += btn.dataset.val;
  updateIndicators();

  if (currentPin.length === 8) {
    setTimeout(checkPin, 300);
  }
}

// ── # key = clear all ──
function clearPin() {
  if (pinLocked) return;
  currentPin = '';
  updateIndicators();
  document.getElementById('wrongMsg').classList.remove('show');
}

// ── ✕ key = backspace ──
function backspacePin() {
  if (pinLocked || currentPin.length === 0) return;
  currentPin = currentPin.slice(0, -1);
  updateIndicators();
  document.getElementById('wrongMsg').classList.remove('show');
}

// ── Check PIN ──
function checkPin() {
  if (currentPin === CORRECT_PIN || currentPin === CORRECT_PIN2) {
    onCorrectPin();
  } else {
    onWrongPin();
  }
}
const pCanvas = document.getElementById('particle-canvas');
const pCtx = pCanvas.getContext('2d');
let particles = [];

function resizeParticleCanvas() {
  pCanvas.width = window.innerWidth;
  pCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeParticleCanvas);
resizeParticleCanvas();

// ── Particle class (hearts + sparkles from key press) ──
class KeyParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.type = Math.random() > 0.5 ? 'heart' : 'sparkle';
    this.size = Math.random() * 7 + 4;
    this.speedX = (Math.random() - 0.5) * 2.5;
    this.speedY = -(Math.random() * 2.5 + 1.5);
    this.gravity = 0.06;
    this.opacity = 1;
    this.decay = Math.random() * 0.025 + 0.02;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.1;
    const pinks = ['#ffc0d8', '#f090b8', '#ff85a1', '#fde0ec', '#f3c641'];
    this.color = pinks[Math.floor(Math.random() * pinks.length)];
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.speedY += this.gravity;
    this.opacity -= this.decay;
    this.rotation += this.rotSpeed;
  }

  draw() {
    if (this.opacity <= 0) return;
    pCtx.save();
    pCtx.globalAlpha = Math.max(0, this.opacity);
    pCtx.translate(this.x, this.y);
    pCtx.rotate(this.rotation);
    pCtx.fillStyle = this.color;

    if (this.type === 'heart') {
      const s = this.size;
      pCtx.beginPath();
      pCtx.moveTo(0, s * 0.3);
      pCtx.bezierCurveTo(0, 0, -s/2, 0, -s/2, s*0.4);
      pCtx.bezierCurveTo(-s/2, s*0.8, 0, s*1.1, 0, s*1.3);
      pCtx.bezierCurveTo(0, s*1.1, s/2, s*0.8, s/2, s*0.4);
      pCtx.bezierCurveTo(s/2, 0, 0, 0, 0, s*0.3);
      pCtx.fill();
    } else {
      // sparkle: 4-point star
      pCtx.strokeStyle = this.color;
      pCtx.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        pCtx.beginPath();
        pCtx.moveTo(Math.cos(angle) * this.size * 0.3, Math.sin(angle) * this.size * 0.3);
        pCtx.lineTo(Math.cos(angle) * this.size, Math.sin(angle) * this.size);
        pCtx.stroke();
      }
    }
    pCtx.restore();
  }

  isDead() { return this.opacity <= 0; }
}

function animateParticles() {
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  particles = particles.filter(p => !p.isDead());
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animateParticles);
}
animateParticles();

function spawnKeyParticles(btn) {
  const rect = btn.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < 10; i++) {
    particles.push(new KeyParticle(cx, cy));
  }
}

// ── Ripple on key press ──
function spawnRipple(btn) {
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const size = Math.max(btn.offsetWidth, btn.offsetHeight);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (btn.offsetWidth / 2 - size / 2) + 'px';
  ripple.style.top  = (btn.offsetHeight / 2 - size / 2) + 'px';
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}


// ── Wrong PIN ──
function onWrongPin() {
  const indicators = document.getElementById('passIndicators');
  indicators.classList.add('shake');
  indicators.addEventListener('animationend', () => indicators.classList.remove('shake'), { once: true });
  document.getElementById('wrongMsg').classList.add('show');
  setTimeout(() => {
    currentPin = '';
    updateIndicators();
  }, 600);
}

// ── Correct PIN ──
function onCorrectPin() {
  pinLocked = true;

  // 1. Pop all indicators
  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      const dot = document.getElementById('ind-' + i);
      dot.classList.add('filled', 'pop');
    }, i * 70);
  }

  // 2. Play birthday burst sound
  setTimeout(() => {
    window.BirthdaySound?.play('unlock');
    window.BgMusic?.init();  // ← add this
  }, 280);

  // 3. Show success message
  setTimeout(() => {
    document.getElementById('successMsg').classList.add('show');
  }, 350);

  // 4. Launch confetti + sprinkles burst
  setTimeout(() => {
    launchBirthdayBurst();
  }, 400);

  // 5. Phone unlock animation then navigate
  setTimeout(() => {
    phoneUnlockTransition();
  }, 2000);
}

// ── Birthday Burst Sound (Web Audio API — no file needed) ──
function playBurstSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const actx = new AudioCtx();

    // Layer 1: pop/crack
    const bufferSize = actx.sampleRate * 0.15;
    const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }
    const noise = actx.createBufferSource();
    noise.buffer = buffer;

    const filter = actx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.6;

    const gainNode = actx.createGain();
    gainNode.gain.setValueAtTime(1.2, actx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.18);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(actx.destination);
    noise.start();
    noise.stop(actx.currentTime + 0.18);

    // Layer 2: sparkle high tones
    const freqs = [880, 1100, 1320, 1760];
    freqs.forEach((freq, i) => {
      const osc = actx.createOscillator();
      const g = actx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, actx.currentTime + i * 0.04);
      g.gain.linearRampToValueAtTime(0.18, actx.currentTime + i * 0.04 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + i * 0.04 + 0.22);
      osc.connect(g);
      g.connect(actx.destination);
      osc.start(actx.currentTime + i * 0.04);
      osc.stop(actx.currentTime + i * 0.04 + 0.25);
    });

  } catch(e) {
    console.log('Audio not available:', e);
  }
}

// ── Confetti + Sprinkles Burst ──
const CONFETTI_COLORS = [
  '#ff6eb4', '#ffb347', '#ffe66d', '#a8edea',
  '#fd79a8', '#fdcb6e', '#6c5ce7', '#00cec9',
  '#ff7675', '#ffeaa7', '#fab1d3'
];

class ConfettiPiece {
  constructor(fromX, fromY, index, total) {
    // spread from multiple launch points across bottom-center
    const spread = (index / total - 0.5) * window.innerWidth * 0.9;
    this.x = fromX + spread * 0.3;
    this.y = fromY;
    this.type = Math.random() < 0.12 ? 'heart' : (Math.random() < 0.3 ? 'circle' : 'rect');
    this.color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    this.w = Math.random() * 9 + 5;
    this.h = this.type === 'rect' ? Math.random() * 5 + 3 : this.w;

    // shoot upward with spread
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const speed = Math.random() * 14 + 8;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.gravity = 0.28;
    this.drag = 0.985;

    this.rotation = Math.random() * 360;
    this.rotSpeed = (Math.random() - 0.5) * 8;
    this.opacity = 1;
    this.decay = Math.random() * 0.008 + 0.004;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = Math.random() * 0.08 + 0.03;
  }

  update() {
    this.vy += this.gravity;
    this.vx *= this.drag;
    this.vy *= this.drag;
    this.wobble += this.wobbleSpeed;
    this.x += this.vx + Math.sin(this.wobble) * 0.5;
    this.y += this.vy;
    this.rotation += this.rotSpeed;
    this.opacity -= this.decay;
  }

  draw(ctx) {
    if (this.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.fillStyle = this.color;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation * Math.PI / 180);

    if (this.type === 'rect') {
      ctx.fillRect(-this.w/2, -this.h/2, this.w, this.h);
    } else if (this.type === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, this.w/2, 0, Math.PI*2);
      ctx.fill();
    } else {
      // heart
      const s = this.w * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, s*0.3);
      ctx.bezierCurveTo(0,0, -s,0, -s,s*0.4);
      ctx.bezierCurveTo(-s,s*0.9, 0,s*1.2, 0,s*1.4);
      ctx.bezierCurveTo(0,s*1.2, s,s*0.9, s,s*0.4);
      ctx.bezierCurveTo(s,0, 0,0, 0,s*0.3);
      ctx.fill();
    }
    ctx.restore();
  }

  isDead() { return this.opacity <= 0 || this.y > window.innerHeight + 60; }
}

// Sprinkle streaks
class Sprinkle {
  constructor(fromX, fromY) {
    this.x = fromX;
    this.y = fromY;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 10 + 6;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 6;
    this.length = Math.random() * 18 + 8;
    this.color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    this.opacity = 1;
    this.gravity = 0.2;
    this.drag = 0.96;
  }

  update() {
    this.vx *= this.drag;
    this.vy += this.gravity;
    this.vy *= this.drag;
    this.x += this.vx;
    this.y += this.vy;
    this.opacity -= 0.022;
  }

  draw(ctx) {
    if (this.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 3, this.y - this.vy * 3);
    ctx.stroke();
    ctx.restore();
  }

  isDead() { return this.opacity <= 0; }
}

let confettiPieces = [];
let sprinkles = [];
let confettiRunning = false;

function launchBirthdayBurst() {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight * 0.6;

  // Multiple launch poppers
  const poppers = [
    { x: cx, y: cy },
    { x: cx - 80, y: cy + 30 },
    { x: cx + 80, y: cy + 30 },
  ];

  poppers.forEach((pos, pi) => {
    setTimeout(() => {
      // confetti
      for (let i = 0; i < 55; i++) {
        confettiPieces.push(new ConfettiPiece(pos.x, pos.y, i, 55));
      }
      // sprinkles
      for (let i = 0; i < 25; i++) {
        sprinkles.push(new Sprinkle(pos.x, pos.y));
      }
    }, pi * 120);
  });

  if (!confettiRunning) {
    confettiRunning = true;
    animateConfetti();
  }
}

function animateConfetti() {
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

  // draw existing key particles too
  particles = particles.filter(p => !p.isDead());
  particles.forEach(p => { p.update(); p.draw(); });

  confettiPieces = confettiPieces.filter(c => !c.isDead());
  confettiPieces.forEach(c => { c.update(); c.draw(pCtx); });

  sprinkles = sprinkles.filter(s => !s.isDead());
  sprinkles.forEach(s => { s.update(); s.draw(pCtx); });

  if (confettiPieces.length > 0 || sprinkles.length > 0 || confettiRunning) {
    requestAnimationFrame(animateConfetti);
  } else {
    confettiRunning = false;
    // hand back to normal particle loop
    animateParticles();
  }
}

// ── Phone Unlock Transition ──
function phoneUnlockTransition() {
  const screen = document.getElementById('next-screen');

  // add unlock class — scales up + fades like phone unlock
  screen.classList.add('phone-unlock');

  setTimeout(() => {
    screen.style.display = 'none';
    showInterlude();
  }, 700);
}

// ============================================
//   INTERLUDE SCREEN — typewriter + continue
// ============================================

const INTERLUDE_LINES = [
  "Dekte chas Ki baniyechi tor jonne...hmmm?😜 ",
  "okay go ahead!, Asa kori bhalo lagbe ✨"
];

function showInterlude() {
  const interlude = document.getElementById('interlude-screen');
  JourneyNav.setState({ reachedInterlude: true });
  interlude.classList.add('visible', 'page-root');
  renderInterludeBackButton();
  typeInterludeMessage();
}

function typeInterludeMessage() {
  const msgEl   = document.getElementById('interludeMessage');
  const cursor  = document.getElementById('interludeCursor');
  const btn     = document.getElementById('interludeBtn');

  const CHAR_SPEED   = 38;  // ms per character — comfortable reading pace
  const LINE_PAUSE   = 700; // pause between the two lines

  let lineIndex = 0;
  let charIndex = 0;
  let fullText  = '';

  function typeChar() {
    const currentLine = INTERLUDE_LINES[lineIndex];

    if (charIndex < currentLine.length) {
      fullText += currentLine[charIndex];
      msgEl.textContent = fullText;
      charIndex++;
      setTimeout(typeChar, CHAR_SPEED);
    } else {
      lineIndex++;
      if (lineIndex < INTERLUDE_LINES.length) {
        fullText += ' ';
        charIndex = 0;
        setTimeout(typeChar, LINE_PAUSE);
      } else {
        // typing complete — hide cursor, fade in the button
        cursor.classList.add('hidden');
        setTimeout(() => btn.classList.add('visible'), 400);
      }
    }
  }

  setTimeout(typeChar, 600); // brief start delay after screen appears
}

// Soft tap sound when the continue button is pressed
function playGentleTap() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const actx = new AudioCtx();
    const osc  = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, actx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, actx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + 0.2);
  } catch (e) {
    console.log('Audio not available:', e);
  }
}

function goToPoem() {

  JourneyNav.setState({ reachedPoem: true });
  JourneyNav.goTo('poem.html', '#interlude-screen');
}
function restoreInterludeFromHash() {
  if (window.location.hash !== '#interlude') return;

  isOpened = true;
  const openingScreen = document.getElementById('opening-screen');
  const nextScreen = document.getElementById('next-screen');
  const interlude = document.getElementById('interlude-screen');
  const msgEl = document.getElementById('interludeMessage');
  const cursor = document.getElementById('interludeCursor');
  const btn = document.getElementById('interludeBtn');

  openingScreen.style.display = 'none';
  nextScreen.style.display = 'none';
  nextScreen.classList.remove('visible', 'phone-unlock');
  interlude.classList.add('visible', 'page-root');
  msgEl.textContent = INTERLUDE_LINES.join(' ');
  cursor.classList.add('hidden');
  btn.classList.add('visible');
  renderInterludeBackButton();
}

restoreInterludeFromHash();



