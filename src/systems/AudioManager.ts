export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Pentatonic scale (C Major Pentatonic: C, D, E, G, A)
  // Expanded to multiple octaves
  private frequencies = [
    261.63, 293.66, 329.63, 392.00, 440.00, // C4 - A4
    523.25, 587.33, 659.25, 783.99, 880.00, // C5 - A5
    1046.50 // C6
  ];

  constructor() {
    // AudioContext must be resumed on user interaction
  }

  public init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // Prevent clipping
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playSpawnSound() {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pick a random note from the pentatonic scale
    const freq = this.frequencies[Math.floor(Math.random() * this.frequencies.length)];
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    // Envelope
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.05); // Attack
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5); // Release

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  public playCollectSound(success: boolean) {
     if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Success = Higher pitch harmonic, "Fail" (energy loss) = Lower pitch but still harmonic (no harsh buzz)
    // Actually GEMINI.md says: "No negative sounds".
    // So even for "wrong color", maybe just a neutral or softer sound, or silence?
    // "Every touch must trigger a positive multimodal (visual/auditory) reaction."
    // But collecting the wrong color is a "Father" mistake.
    // Let's make "Collect" sound distinct.
    
    const freq = success ? 523.25 * 2 : 261.63; // High C vs Low C

    osc.type = success ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(success ? 0.3 : 0.2, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }
}
