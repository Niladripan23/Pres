// ============================================
//   BIRTHDAY SOUND FX — tiny WebAudio moments
//   No audio files needed. Unlocks after first tap/click.
// ============================================
(function () {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    window.BirthdaySound = { play() {}, unlock() {} };
    return;
  }

  let ctx = null;
  let unlocked = false;
  const masterVolume = 0.23;

  function getCtx() {
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function unlock() {
    const audio = getCtx();
    unlocked = true;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.connect(audio.destination);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.02);
    setTimeout(() => gain.disconnect(), 40);
  }

  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true });

  function tone(freq, start, duration, options = {}) {
    if (!unlocked) return;
    const audio = getCtx();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime + start;
    const volume = (options.volume ?? 1.0) * masterVolume;

    osc.type = options.type || 'sine';
    osc.frequency.setValueAtTime(freq, now);
    if (options.to) osc.frequency.exponentialRampToValueAtTime(options.to, now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  function noise(start, duration, options = {}) {
    if (!unlocked) return;
    const audio = getCtx();
    const sampleCount = Math.max(1, Math.floor(audio.sampleRate * duration));
    const buffer = audio.createBuffer(1, sampleCount, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      const fade = 1 - i / sampleCount;
      data[i] = (Math.random() * 2 - 1) * fade * (options.soft ? 0.32 : 1);
    }

    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    const now = audio.currentTime + start;

    filter.type = options.filter || 'highpass';
    filter.frequency.setValueAtTime(options.frequency || 900, now);
    gain.gain.setValueAtTime((options.volume ?? 0.1) * masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    source.start(now);
    source.stop(now + duration + 0.02);
  }

  const effects = {
    giftLand() {
      noise(0, 0.18, { volume: 0.08, frequency: 650, soft: true });
      tone(520, 0.03, 0.18, { volume: 0.18 });
      tone(780, 0.12, 0.22, { volume: 0.13 });
    },
    giftOpen() {
      tone(660, 0, 0.14, { volume: 0.16 });
      tone(990, 0.08, 0.22, { volume: 0.16 });
      tone(1320, 0.18, 0.28, { volume: 0.11 });
      noise(0.03, 0.16, { volume: 0.045, frequency: 2200, soft: true });
    },
    unlock() {
      tone(440, 0, 0.1, { volume: 0.14 });
      tone(660, 0.08, 0.16, { volume: 0.17 });
      tone(880, 0.2, 0.24, { volume: 0.12 });
    },
    page() {
      noise(0, 0.22, { volume: 0.035, frequency: 1200, soft: true });
      tone(520, 0.03, 0.16, { volume: 0.055, to: 680 });
    },
    photoFlip() {
      noise(0, 0.12, { volume: 0.09, frequency: 1500, soft: true });
      noise(0.09, 0.08, { volume: 0.045, frequency: 900, soft: true });
    },
    glassTap() {
      tone(940, 0, 0.08, { volume: 0.13 });
      tone(1320, 0.035, 0.1, { volume: 0.075 });
    },
    lidPop() {
      noise(0, 0.1, { volume: 0.07, frequency: 700, soft: true });
      tone(360, 0.01, 0.08, { volume: 0.1, to: 520 });
      tone(840, 0.09, 0.16, { volume: 0.08 });
    },
    paperOpen() {
      noise(0, 0.18, { volume: 0.1, frequency: 1300, soft: true });
      tone(620, 0.06, 0.12, { volume: 0.045 });
    },
    paperClose() {
      noise(0, 0.14, { volume: 0.075, frequency: 850, soft: true });
      tone(420, 0.04, 0.12, { volume: 0.04 });
    },
    success() {
      tone(620, 0, 0.12, { volume: 0.13 });
      tone(830, 0.1, 0.18, { volume: 0.13 });
      tone(1100, 0.22, 0.28, { volume: 0.1 });
    },
    final() {
      tone(520, 0, 0.22, { volume: 0.09 });
      tone(780, 0.16, 0.28, { volume: 0.11 });
      tone(1040, 0.36, 0.38, { volume: 0.08 });
      noise(0.12, 0.28, { volume: 0.03, frequency: 2200, soft: true });
    }
  };

  window.BirthdaySound = {
    unlock,
    play(name) {
      try {
        if (!effects[name]) return;
        effects[name]();
      } catch (error) {
        console.debug('Sound unavailable:', error);
      }
    }
  };
})();
