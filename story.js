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

// ===== GLOBALS =====
const FEEDBACK_ALREADY_SUBMITTED = !!JourneyNav.getState().feedbackSubmitted;
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xdavrgao';
let feedbackSubmitting = false;

// ===================================


// ===== 1. FLOATING HEARTS =====
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


// ===== 2. FIREFLIES / GLOWING PARTICLES =====
const fCanvas = document.getElementById('fireflies-canvas');
const fCtx    = fCanvas.getContext('2d');

function resizeFCanvas() {
  fCanvas.width  = window.innerWidth;
  fCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeFCanvas);
resizeFCanvas();

class Firefly {
  constructor() {
    this.x = Math.random() * fCanvas.width;
    this.y = Math.random() * fCanvas.height;
    this.baseR = Math.random() * 1.8 + 1;
    this.phase = Math.random() * Math.PI * 2;
    this.flickerSpeed = Math.random() * 0.025 + 0.012;
    this.driftAngle = Math.random() * Math.PI * 2;
    this.driftSpeed = Math.random() * 0.15 + 0.05;
    this.color = ['#ffd9a0', '#ffe6c2', '#ffc98a'][Math.floor(Math.random() * 3)];
  }
  update() {
    this.phase += this.flickerSpeed;
    this.driftAngle += 0.003;
    this.x += Math.cos(this.driftAngle) * this.driftSpeed;
    this.y += Math.sin(this.driftAngle) * this.driftSpeed * 0.6;
    if (this.x < -10) this.x = fCanvas.width + 10;
    if (this.x > fCanvas.width + 10) this.x = -10;
    if (this.y < -10) this.y = fCanvas.height + 10;
    if (this.y > fCanvas.height + 10) this.y = -10;
  }
  draw() {
    const brightness = (Math.sin(this.phase) + 1) / 2;
    const r = this.baseR * (0.6 + brightness * 0.6);
    const alpha = 0.2 + brightness * 0.45;
    const grad = fCtx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 5);
    grad.addColorStop(0, `rgba(255,220,170,${alpha})`);
    grad.addColorStop(1, 'rgba(255,180,80,0)');
    fCtx.beginPath();
    fCtx.arc(this.x, this.y, r * 5, 0, Math.PI * 2);
    fCtx.fillStyle = grad;
    fCtx.fill();
    fCtx.beginPath();
    fCtx.arc(this.x, this.y, r, 0, Math.PI * 2);
    fCtx.fillStyle = `rgba(255,245,225,${0.5 + brightness * 0.4})`;
    fCtx.fill();
  }
}

let fireflies = [];
function initFireflies() {
  fireflies = [];
  const n = window.innerWidth < 480 ? 10 : 16;
  for (let i = 0; i < n; i++) fireflies.push(new Firefly());
}
function animateFireflies() {
  fCtx.clearRect(0, 0, fCanvas.width, fCanvas.height);
  fireflies.forEach(f => { f.update(); f.draw(); });
  requestAnimationFrame(animateFireflies);
}
initFireflies();
animateFireflies();
window.addEventListener('resize', initFireflies);


// ===== 3. AUDIO PLAYER LOGIC =====
function initAudioPlayer() {
  const audio        = document.getElementById('storyAudio');
  const playBtn      = document.getElementById('audioPlayBtn');
  const playIcon     = document.getElementById('playIcon');
  const pauseIcon    = document.getElementById('pauseIcon');
  const timeDisplay  = document.getElementById('audioCurrentTime');
  const seeker       = document.getElementById('audioSeeker');
  const waveformFill = document.getElementById('waveformFill');
  const continueBtn  = document.getElementById('storyContinueBtn');
  const wrapper      = document.getElementById('scrapbookWrapper');

  let isPlaying   = false;
  let audioEnded  = false;

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function setIcons(playing) {
    playIcon.style.display  = playing ? 'none'  : 'block';
    pauseIcon.style.display = playing ? 'block' : 'none';
  }

  // Show duration once metadata loads (covers the static "01:21" in PNG)
  audio.addEventListener('loadedmetadata', () => {
    timeDisplay.textContent = formatTime(audio.duration);
  });

  // Smooth progress + live time updates
  audio.addEventListener('timeupdate', () => {
    const duration = audio.duration;
    if (duration > 0) {
      const pct = (audio.currentTime / duration) * 100;
      seeker.value              = pct;
      waveformFill.style.width  = pct + '%';
    }
    timeDisplay.textContent = formatTime(audio.currentTime);
  });

  // Tap waveform to seek
  seeker.addEventListener('input', () => {
    const duration = audio.duration;
    if (duration > 0) {
      audio.currentTime = (seeker.value / 100) * duration;
    }
  });

  // Play / pause toggle
  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.warn('Audio play failed:', err));
    }
  });

  audio.addEventListener('play', () => {
    isPlaying = true;
    playBtn.classList.add('playing');
    setIcons(true);
  });

  audio.addEventListener('pause', () => {
    isPlaying = false;
    playBtn.classList.remove('playing');
    setIcons(false);
  });

  audio.addEventListener('ended', () => {
    isPlaying  = false;
    audioEnded = true;
    playBtn.classList.remove('playing');
    setIcons(false);
    playIcon.style.display = 'none';
    // Reset time display to show full duration
    timeDisplay.textContent = formatTime(audio.duration);
    seeker.value = 100;
    waveformFill.style.width = '100%';

    // Subtle completion glow + unlock continue button
    wrapper.classList.add('audio-finished-glow');
    continueBtn.classList.remove('disabled-btn');
    continueBtn.classList.add('visible');
  });

  // Show continue button (disabled) after a short delay
  setTimeout(() => {
  continueBtn.classList.remove('disabled-btn');
  continueBtn.classList.add('visible');
}, 1500);
}


// ===== 4. SCREEN TRANSITION — story → feedback =====
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

function goToFeedback() {
  const storyScreen = document.getElementById('storyScreen');
  const feedbackScreen = document.getElementById('feedbackScreen');
  const feedbackThanksScreen = document.getElementById('feedbackThanksScreen');
  const alreadySubmitted = !!JourneyNav.getState().feedbackSubmitted;


  window.BgMusic?.fadeOut();
  storyScreen.classList.add('fade-out');

  // Pause audio if it's currently playing when moving away
  const audio = document.getElementById('storyAudio');
  if (audio && !audio.paused) {
      audio.pause();
  }

  setTimeout(() => {
    storyScreen.style.display = 'none';

    if (alreadySubmitted) {
      feedbackThanksScreen.classList.add('visible');
      if (smartBackBtn) smartBackBtn.style.display = 'none';
      setTimeout(() => document.getElementById('feedbackThanksContinueBtn').classList.add('visible'), 350);
      return;
    }

    feedbackScreen.classList.add('visible');
    setBackButtonForFeedback();
  }, JourneyNav.TRANSITION_MS);
}

function goBackToStory() {
  const storyScreen    = document.getElementById('storyScreen');
  const feedbackScreen = document.getElementById('feedbackScreen');

  feedbackScreen.classList.add('fade-out');

  setTimeout(() => {
    feedbackScreen.classList.remove('visible', 'fade-out');
    storyScreen.style.display = 'flex';
    storyScreen.classList.remove('fade-out');
    setBackButtonForStory();
  }, 600);
}

let smartBackBtn = null;
let smartBackHandler = null;

function setSmartBackHandler(handler) {
  if (!smartBackBtn) {
    smartBackBtn = JourneyNav.renderBackButton(null, handler);
    smartBackHandler = handler;
    return;
  }
  if (smartBackHandler) {
    smartBackBtn.removeEventListener('click', smartBackHandler);
  }
  smartBackHandler = handler;
  smartBackBtn.addEventListener('click', smartBackHandler);
  smartBackBtn.style.display = 'flex';
}

function setBackButtonForStory() {
  setSmartBackHandler(() => JourneyNav.goTo('jar.html', '#storyScreen'));
}

function setBackButtonForFeedback() {
  setSmartBackHandler(goBackToStory);
}

setBackButtonForStory();
initAudioPlayer(); // Initialize the new audio system


// ===== 5. FEEDBACK INPUT HANDLER =====
function onFeedbackInput() {
  const textarea = document.getElementById('feedbackTextarea');
  const submitBtn = document.getElementById('submitBtn');
  const message = textarea.value.trim();

  // If there is any text at all, show the submit button
  if (message.length > 0) {
    submitBtn.classList.add('visible');
  } else {
    submitBtn.classList.remove('visible');
  }

  JourneyNav.setState({ feedbackDraft: textarea.value });
}

// restore any feedback draft already typed earlier this session
(function restoreFeedbackDraft() {
  const saved = JourneyNav.getState();
  if (saved.feedbackDraft) {
    const textarea = document.getElementById('feedbackTextarea');
    textarea.value = saved.feedbackDraft;
    onFeedbackInput(); // re-run to update the submit button state
  }
})();

function showFinalScreen(restored = false) {
  if (!restored) window.BirthdaySound?.play('final');
  const storyScreen = document.getElementById('storyScreen');
  const feedbackScreen = document.getElementById('feedbackScreen');
  const feedbackThanksScreen = document.getElementById('feedbackThanksScreen');
  const finalScreen = document.getElementById('finalScreen');
  const visitAgainBtn = document.getElementById('visitAgainBtn');

  storyScreen.style.display = 'none';
  feedbackScreen.style.display = 'none';
  feedbackThanksScreen.classList.remove('visible');
  finalScreen.classList.add('visible');
  if (smartBackBtn) smartBackBtn.style.display = 'none';

  setTimeout(() => {
    visitAgainBtn.classList.add('visible');
  }, restored ? 250 : 1100);
}

async function submitFeedback() {
  if (feedbackSubmitting) return;

  const feedbackScreen = document.getElementById('feedbackScreen');
  const textarea = document.getElementById('feedbackTextarea');
  const status = document.getElementById('feedbackStatus');
  const submitBtn = document.getElementById('submitBtn');
  const message = textarea.value.trim();

  if (message.length === 0) return; // Prevent submitting an empty box

  feedbackSubmitting = true;
  submitBtn.classList.add('sending');
  submitBtn.textContent = 'Sending... ♡';
  status.textContent = 'Sending your words safely...';
  status.classList.add('show');
  status.classList.remove('error');

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        page: 'Birthday present feedback',
        submittedAt: new Date().toISOString()
      })
    });

    if (!response.ok) throw new Error('Formspree request failed');

    JourneyNav.setState({ feedbackDraft: message, feedbackSubmitted: true });
      window.BirthdaySound?.play('success');
    status.textContent = 'Sent. Thank you for sharing your heart ♡';

    setTimeout(() => {
      feedbackScreen.classList.add('fade-out');
      setTimeout(() => {
        showFinalScreen(false);
      }, JourneyNav.TRANSITION_MS);
    }, 550);
  } catch (error) {
    feedbackSubmitting = false;
    submitBtn.classList.remove('sending');
    submitBtn.textContent = '♡ Submit';
    status.textContent = 'Could not send just now. Please try again.';
    status.classList.add('show', 'error');
  }
}

function visitAgain() {
  JourneyNav.goTo('index.html', '#finalScreen');
}