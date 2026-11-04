/**
 * Synthesizes a gentle, calming bell chime using Web Audio API
 * No external audio files or network requests needed.
 */
export function playChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playTone = (freq: number, delay: number, duration: number, gainValue: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(gainValue, now + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + duration);
    };

    // Harmonic bell chord: C5, E5, G5, C6
    playTone(523.25, 0, 1.2, 0.25);
    playTone(659.25, 0.15, 1.4, 0.2);
    playTone(783.99, 0.3, 1.6, 0.2);
    playTone(1046.5, 0.45, 2.0, 0.15);
  } catch (e) {
    console.warn('Audio playback not supported or blocked by user gesture:', e);
  }
}
