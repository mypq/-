import { SoundSettings } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private settings: SoundSettings = {
    masterMute: false,
    musicVolume: 0.6,
    sfxVolume: 0.8,
  };

  // Node references for continuous water stream & music
  private waterNoiseNode: AudioBufferSourceNode | null = null;
  private waterFilter: BiquadFilterNode | null = null;
  private waterGain: GainNode | null = null;

  // Background music nodes
  private musicInterval: any = null;
  private isMusicPlaying: boolean = false;
  private currentMusicMode: 'menu' | 'tense' | 'none' = 'none';
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('water_challenge_sound');
      if (saved) {
        this.settings = JSON.parse(saved);
      }
    } catch {
      // Ignore storage errors
    }
  }

  public saveSettings(newSettings: SoundSettings) {
    this.settings = { ...newSettings };
    try {
      localStorage.setItem('water_challenge_sound', JSON.stringify(this.settings));
    } catch {}

    this.applyVolumes();
  }

  public getSettings(): SoundSettings {
    return { ...this.settings };
  }

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private applyVolumes() {
    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const masterVal = this.settings.masterMute ? 0 : 1;
    this.masterGain.gain.setValueAtTime(masterVal, now);
    this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume, now);
    this.musicGain.gain.setValueAtTime(this.settings.musicVolume * 0.45, now);
  }

  // --- BUTTON CLICK ---
  public playClick() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.settings.masterMute) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  // --- TURN SWITCH SOUND ---
  public playTurnSwitch() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.settings.masterMute) return;

      const now = this.ctx.currentTime;
      // Dual bell chime
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.25, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.26);
      });
    } catch {}
  }

  // --- REALISTIC WATER FLOW STREAM WITH ACOUSTIC RESONANCE PITCH SHIFT ---
  public startWaterFlow(initialLevel: number) {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;

      this.stopWaterFlow();

      const now = this.ctx.currentTime;

      // 1. Faucet valve mechanical click
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(140, now);
      clickOsc.frequency.exponentialRampToValueAtTime(40, now + 0.04);
      clickGain.gain.setValueAtTime(0.4, now);
      clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      clickOsc.connect(clickGain);
      clickGain.connect(this.sfxGain);
      clickOsc.start(now);
      clickOsc.stop(now + 0.04);

      // 2. Procedural white noise buffer for continuous rushing water
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        // Pink-like smooth noise
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Resonant bandpass filter: frequency increases with water level (acoustic chamber gets smaller!)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      const baseFreq = 400 + (initialLevel / 100) * 1200; // 400Hz to 1600Hz
      filter.frequency.setValueAtTime(baseFreq, now);
      filter.Q.setValueAtTime(3.2, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.65, now + 0.08);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noiseSource.start(now);

      this.waterNoiseNode = noiseSource;
      this.waterFilter = filter;
      this.waterGain = gain;
    } catch {}
  }

  public updateWaterLevelPitch(waterLevel: number) {
    if (!this.ctx || !this.waterFilter) return;
    try {
      const now = this.ctx.currentTime;
      // Acoustic vessel physics: column of air shrinks, fundamental resonant pitch climbs
      const newFreq = 400 + Math.min(100, Math.max(0, waterLevel)) * 14; // up to 1800Hz
      this.waterFilter.frequency.setTargetAtTime(newFreq, now, 0.05);
    } catch {}
  }

  public stopWaterFlow() {
    try {
      if (this.ctx && this.waterGain) {
        const now = this.ctx.currentTime;
        this.waterGain.gain.linearRampToValueAtTime(0.001, now + 0.06);

        // Faucet closing snap
        if (this.sfxGain) {
          const clickOsc = this.ctx.createOscillator();
          const clickGain = this.ctx.createGain();
          clickOsc.type = 'square';
          clickOsc.frequency.setValueAtTime(90, now);
          clickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.03);
          clickGain.gain.setValueAtTime(0.25, now);
          clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
          clickOsc.connect(clickGain);
          clickGain.connect(this.sfxGain);
          clickOsc.start(now);
          clickOsc.stop(now + 0.03);
        }

        setTimeout(() => {
          if (this.waterNoiseNode) {
            try {
              this.waterNoiseNode.stop();
              this.waterNoiseNode.disconnect();
            } catch {}
            this.waterNoiseNode = null;
          }
          this.waterFilter = null;
          this.waterGain = null;
        }, 70);
      }
    } catch {}
  }

  // --- OVERFLOW DRAMATIC CRASH SOUND ---
  public playOverflowSound() {
    this.stopWaterFlow();
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.settings.masterMute) return;

      const now = this.ctx.currentTime;

      // Heavy splash noise
      const bufferSize = this.ctx.sampleRate * 1.5;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.4));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.linearRampToValueAtTime(200, now + 1.2);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);

      // Deep dramatic bass drop
      const bass = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bass.type = 'sawtooth';
      bass.frequency.setValueAtTime(120, now);
      bass.frequency.exponentialRampToValueAtTime(35, now + 0.8);
      bassGain.gain.setValueAtTime(0.7, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      bass.connect(bassGain);
      bassGain.connect(this.sfxGain);
      bass.start(now);
      bass.stop(now + 0.9);
    } catch {}
  }

  // --- VICTORY CELEBRATION FANFARE ---
  public playVictory() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.settings.masterMute) return;

      const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
      const now = this.ctx.currentTime;

      notes.forEach((freq, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startTime = now + i * 0.1;
        const duration = i === notes.length - 1 ? 0.8 : 0.2;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.35, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
      });
    } catch {}
  }

  // --- DEFEAT SAD CHORD ---
  public playDefeat() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.settings.masterMute) return;

      const now = this.ctx.currentTime;
      const notes = [311.13, 277.18, 233.08, 196.0]; // Diminishing minor notes

      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const t = now + idx * 0.22;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.65);
      });
    } catch {}
  }

  // --- TENSION BEAT DURING MATCH ---
  public playTensionPulse(waterLevel: number) {
    if (waterLevel < 65) return;
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || this.settings.masterMute) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Heartbeat pulse frequency rises with tension
      const pitch = waterLevel > 90 ? 110 : 80;
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

      const intensity = waterLevel > 90 ? 0.35 : 0.2;
      gain.gain.setValueAtTime(intensity, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  // --- PROCEDURAL CINEMATIC BACKGROUND MUSIC ---
  public startMusic(mode: 'menu' | 'tense') {
    if (this.currentMusicMode === mode && this.isMusicPlaying) return;
    this.stopMusic();

    this.initContext();
    this.currentMusicMode = mode;
    this.isMusicPlaying = true;

    let step = 0;
    // Ambient cinematic pattern
    const menuScale = [220, 261.63, 293.66, 329.63, 392.0, 440];
    const tenseScale = [164.81, 174.61, 196.0, 220, 246.94, 261.63];

    const tempo = mode === 'menu' ? 450 : 320;

    this.musicInterval = setInterval(() => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain || this.settings.masterMute) return;

      try {
        const now = this.ctx.currentTime;
        const scale = mode === 'menu' ? menuScale : tenseScale;
        const note = scale[step % scale.length];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = mode === 'menu' ? 'sine' : 'sawtooth';
        osc.frequency.setValueAtTime(note, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(mode === 'menu' ? 600 : 450, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (tempo / 1000) * 0.9);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + (tempo / 1000));

        step++;
      } catch {}
    }, tempo);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    this.currentMusicMode = 'none';
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const sound = new SoundEngine();
