const NOTES = [110, 165, 220, 330];

/** Short rising chord on boot. Purely decorative, so any audio failure is ignored. */
export function playBootSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const t = ctx.currentTime;

    NOTES.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 0.5, t);
      osc.frequency.exponentialRampToValueAtTime(freq, t + 1.4);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.05 / (i + 1), t + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 2.7);
    });
  } catch {
    // no audio, no problem
  }
}
