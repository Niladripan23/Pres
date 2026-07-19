// ============================================================
//   BACKGROUND MUSIC CONTROLLER
//   - Starts on first user interaction on index.html
//   - Resumes from saved timestamp on every subsequent page
//   - Fades out on page exit, fades in on page enter
//   - Fades out gracefully on the feedback/goodbye section
//   - Volume is controlled by BG_VOLUME below (0.0 – 1.0)
// ============================================================

// Pre-fetch music file so it's cached and ready instantly
const _preloadLink = document.createElement('link');
_preloadLink.rel  = 'preload';
_preloadLink.as   = 'audio';
_preloadLink.href = 'bgmusic.mp3';
document.head.appendChild(_preloadLink);

(function () {

  // ── ✏️  YOUR CONTROLS ──────────────────────────────────────
  const MUSIC_FILE      = 'bgmusic.mp3'; // put your mp3 in the project root
  const BG_VOLUME       = 0.08;           // 0.0 = silent, 1.0 = full volume
  const FADE_OUT_MS     = 3000;          // fade-out duration on feedback page (ms)
  const NAV_FADE_MS     = 550;           // fade out on page exit (match page transition)
  const NAV_FADE_IN_MS  = 800;           // fade in on page enter
  // ────────────────────────────────────────────────────────────

  const SESSION_KEY = 'bgMusicTime';

  let audio     = null;
  let started   = false;
  let fadeTimer = null;

  // ── Save & restore playback position ──
  function saveTime() {
    if (audio && !audio.paused) {
      sessionStorage.setItem(SESSION_KEY, audio.currentTime);
    }
  }

  function getSavedTime() {
    return parseFloat(sessionStorage.getItem(SESSION_KEY) || '0');
  }

  // ── Generic fade helper ──
  function fadeTo(targetVol, durationMs, onDone) {
    if (!audio) return;
    if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }

    const steps   = 30;
    const stepMs  = durationMs / steps;
    const startVol = audio.volume;
    const stepVol  = (targetVol - startVol) / steps;
    let count = 0;

    fadeTimer = setInterval(() => {
      count++;
      const next = startVol + stepVol * count;
      audio.volume = Math.min(Math.max(next, 0), 1);
      if (count >= steps) {
        audio.volume = targetVol;
        clearInterval(fadeTimer);
        fadeTimer = null;
        if (onDone) onDone();
      }
    }, stepMs);
  }

  // ── Create and start the audio element ──
  function startMusic(fadeIn = false) {
    if (started) return;
    started = true;

    audio = new Audio(MUSIC_FILE);
    audio.loop    = true;
    audio.preload = 'auto';
    audio.volume  = fadeIn ? 0 : BG_VOLUME;

    const savedTime = getSavedTime();
    if (savedTime > 0) audio.currentTime = savedTime;

    audio.play().catch(() => {
      started = false;
    });

    if (fadeIn) {
      fadeTo(BG_VOLUME, NAV_FADE_IN_MS);
    }

    // Save timestamp every second
    setInterval(saveTime, 1000);
    window.addEventListener('pagehide', saveTime);
    window.addEventListener('beforeunload', saveTime);
  }

  window.BgMusic = {

    // Call once on index.html after first user interaction
    init() {
      if (started) return;
      startMusic(false); // no fade-in on first start
    },

    // Call on every non-index page — fades in from silence
    resume() {
      if (started) return;
      startMusic(true); // fade in on page enter
    },

    // Call just before JourneyNav.goTo() — fades out over nav duration
    navFadeOut() {
      if (!audio) return;
      fadeTo(0, NAV_FADE_MS, () => {
        saveTime();
        audio.pause();
      });
    },

    // Call when entering feedback section — long graceful fade
    fadeOut() {
      if (!audio) return;
      fadeTo(0, FADE_OUT_MS, () => {
        audio.pause();
        sessionStorage.removeItem(SESSION_KEY);
      });
    }
  };

})();