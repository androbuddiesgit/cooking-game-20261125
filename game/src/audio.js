// Dapur Kilat — all sound is synthesized with WebAudio, no audio files.
// Every effect is a short oscillator or filtered-noise burst, created on the
// first user gesture (browsers block audio before that).

export function createSfx() {
  const sfx = {
    ctx: null,
    muted: false,
    sizzleNodes: null,

    ensure() {
      if (!this.ctx) {
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AC();
        } catch {
          this.ctx = null;
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    },

    tone(freq, seconds, type, gain, when = 0, slideTo = null) {
      if (this.muted) return;
      const ctx = this.ensure();
      if (!ctx) return;
      const t0 = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + seconds);
      amp.gain.setValueAtTime(0.0001, t0);
      amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
      amp.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
      osc.connect(amp).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + seconds + 0.05);
    },

    noise(seconds, gain, filterFreq) {
      if (this.muted) return;
      const ctx = this.ensure();
      if (!ctx) return;
      const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;
      filter.Q.value = 0.8;
      const amp = ctx.createGain();
      amp.gain.value = gain;
      src.connect(filter).connect(amp).connect(ctx.destination);
      src.start();
    },

    click() { this.tone(660, 0.06, 'triangle', 0.12); },
    add() { this.tone(520, 0.07, 'triangle', 0.14); this.tone(780, 0.09, 'triangle', 0.12, 0.05); },
    chop() { this.noise(0.09, 0.5, 900); this.tone(180, 0.08, 'square', 0.1); },
    chopped() { this.tone(440, 0.08, 'triangle', 0.14); this.tone(660, 0.1, 'triangle', 0.14, 0.07); },
    cookStart() { this.noise(0.25, 0.3, 2400); },
    serve() {
      this.tone(523, 0.12, 'triangle', 0.16);
      this.tone(659, 0.12, 'triangle', 0.16, 0.1);
      this.tone(784, 0.2, 'triangle', 0.18, 0.2);
    },
    coin() { this.tone(988, 0.09, 'sine', 0.16); this.tone(1319, 0.16, 'sine', 0.16, 0.07); },
    error() { this.tone(160, 0.16, 'sawtooth', 0.12, 0, 110); },
    burnt() { this.tone(220, 0.3, 'sawtooth', 0.14, 0, 90); this.noise(0.3, 0.25, 500); },
    expired() { this.tone(330, 0.15, 'triangle', 0.12, 0, 196); this.tone(262, 0.25, 'triangle', 0.12, 0.14); },
    tick() { this.tone(880, 0.05, 'square', 0.06); },
    start() {
      [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.14, i * 0.09));
    },

    // Looping wok sizzle while something cooks; call stopSizzle() to end it.
    startSizzle() {
      if (this.muted) return;
      const ctx = this.ensure();
      if (!ctx || this.sizzleNodes) return;
      const len = ctx.sampleRate;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3200;
      filter.Q.value = 0.5;
      const amp = ctx.createGain();
      amp.gain.value = 0.05;
      src.connect(filter).connect(amp).connect(ctx.destination);
      src.start();
      this.sizzleNodes = { src, amp };
    },

    stopSizzle() {
      if (!this.sizzleNodes) return;
      try { this.sizzleNodes.src.stop(); } catch { /* already stopped */ }
      this.sizzleNodes = null;
    },

    setMuted(muted) {
      this.muted = muted;
      if (muted) this.stopSizzle();
    },
  };
  return sfx;
}
