// Speed-Tac Bay 02 Interactive World — 3D Spatial WebAudio & Acoustic Occlusion Engine
// Procedural positional WebAudio sources + Dynamic BiquadFilterNode (365 Hz outside Foreman's Office glass -> 16 kHz inside Office 01!)

export class SpatialAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = false;
    this.muted = false;
    this.startedAt = 0;

    // Live acoustic state for HUD & WDI "The Dook" Transition Portal telemetry
    this.acousticState = {
      insideOffice: false,
      inAirlock: false,
      outsideLot: false,
      doorOpen: false,
      cutoffHz: 365,
      reverbWet: 0.34,
      zoneKey: 'cathedral_bay',
      zoneLabel: 'CATHEDRAL BAY (REVERB 34% • 365Hz GLASS)',
    };

    // Positional loop, Master DynamicsCompressor & WDI Cathedral ConvolverReverb nodes
    this.masterCompressor = null;
    this.reverbConvolver = null;
    this.reverbSendGain = null;
    this.vTwinChopperPanner = null;
    this.boomboxPanner = null;
    this.boomboxGain = null;
    this.conveyorPanner = null;
    this.conveyorGain = null;
    this.officePanner = null;
    this.officeGain = null;
    this.officeGlassFilter = null;
    this.desertPanner = null;
    this.desertGain = null;

    // Lookahead 120 BPM scheduler state
    this.bpm = 120;
    this.stepDur = 60 / this.bpm / 4; // 16th-note = 0.125s
    this.nextNoteTime = 0;
    this.current16th = 0;
    this._schedulerTimer = null;
    this._noiseBuf = null;

    // Visual beat/VU sync even when audio is muted or before unlock
    this.vuLevels = [0.4, 0.5, 0.35, 0.45, 0.3, 0.25];
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.enabled = !this.muted;
      return true;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0.0 : 0.74;

    // Master Peak Limiter / DynamicsCompressorNode (-12 dB threshold, 4:1 ratio) so stacked Reverb + Boombox + Zap never clips!
    this.masterCompressor = this.ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
    this.masterCompressor.knee.setValueAtTime(10, this.ctx.currentTime);
    this.masterCompressor.ratio.setValueAtTime(4, this.ctx.currentTime);
    this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.masterCompressor.release.setValueAtTime(0.18, this.ctx.currentTime);
    this.masterGain.connect(this.masterCompressor);
    this.masterCompressor.connect(this.ctx.destination);

    this._noiseBuf = this._createNoiseBuffer(1.5);
    this._setupPositionalBuses();

    this.startedAt = this.ctx.currentTime;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.current16th = 0;
    this.enabled = !this.muted;

    this._schedulerTimer = window.setInterval(() => this._scheduleTick(), 45);
    return true;
  }

  toggleMute() {
    if (!this.ctx) {
      this.muted = false;
      this.unlock();
      return !this.muted;
    }
    this.muted = !this.muted;
    this.enabled = !this.muted;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(this.muted ? 0.0 : 0.72, now, 0.04);
    if (!this.muted && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return !this.muted;
  }

  _createNoiseBuffer(seconds) {
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * seconds);
    const buf = this.ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + w * 0.029;
      b1 = 0.985 * b1 + w * 0.032;
      b2 = 0.950 * b2 + w * 0.048;
      data[i] = Math.max(-1, Math.min(1, (b0 + b1 + b2 + w * 0.18) * 1.4));
    }
    return buf;
  }

  _makePanner(x, y, z, refDist = 2.4, maxDist = 28, rolloff = 1.35) {
    const p = this.ctx.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = refDist;
    p.maxDistance = maxDist;
    p.rolloffFactor = rolloff;
    p.coneInnerAngle = 360;
    if (p.positionX) {
      p.positionX.value = x;
      p.positionY.value = y;
      p.positionZ.value = z;
    } else {
      p.setPosition(x, y, z);
    }
    return p;
  }

  _createCathedralImpulse(seconds = 2.3) {
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * seconds);
    const buf = this.ctx.createBuffer(2, len, sr);
    const earlyTapsMs = [17, 31, 53, 84, 119];
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (const tapMs of earlyTapsMs) {
        const idx = Math.min(len - 1, Math.floor(((tapMs + ch * 4) / 1000) * sr));
        data[idx] += (ch === 0 ? 0.42 : -0.38) * Math.exp(-tapMs / 140);
      }
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const u = i / len;
        const env = Math.pow(1 - u, 2.85) * 0.24;
        const white = Math.random() * 2 - 1;
        lp = lp * 0.72 + white * 0.28; // warm steel-truss high-bay damping
        data[i] += lp * env;
      }
    }
    return buf;
  }

  _setupPositionalBuses() {
    // WDI Transition Portal Cathedral Reverb Bus (ConvolverNode)
    this.reverbConvolver = this.ctx.createConvolver();
    this.reverbConvolver.buffer = this._createCathedralImpulse(2.3);
    this.reverbSendGain = this.ctx.createGain();
    this.reverbSendGain.gain.value = 0.34;
    this.reverbSendGain.connect(this.reverbConvolver);
    this.reverbConvolver.connect(this.masterGain);

    // 1. Volt's 120 BPM Boombox at (-3.80, 0.58, 12.00)
    this.boomboxGain = this.ctx.createGain();
    this.boomboxGain.gain.value = 0.42;
    this.boomboxPanner = this._makePanner(-3.8, 0.58, 12.0, 2.2, 26, 1.45);
    this.boomboxGain.connect(this.boomboxPanner);
    this.boomboxPanner.connect(this.masterGain);
    this.boomboxPanner.connect(this.reverbSendGain);

    // 2. West-Aisle Useless Conveyor + QC Laser Hum at (-6.80, 0.48, 3.20)
    this.conveyorGain = this.ctx.createGain();
    this.conveyorGain.gain.value = 0.24;
    this.conveyorPanner = this._makePanner(-6.8, 0.48, 3.2, 2.0, 22, 1.5);
    this.conveyorGain.connect(this.conveyorPanner);
    this.conveyorPanner.connect(this.masterGain);
    this.conveyorPanner.connect(this.reverbSendGain);

    // Subtle continuous QC optical scanner hum on conveyor
    const humOsc = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    humOsc.type = 'sine';
    humOsc.frequency.value = 118;
    humGain.gain.value = 0.045;
    humOsc.connect(humGain);
    humGain.connect(this.conveyorGain);
    humOsc.start();

    // 3. Foreman's Office Rant Source at (7.22, 0.68, 5.05) -> Dynamic BiquadFilterNode (Glass Occlusion!)
    this.officeGain = this.ctx.createGain();
    this.officeGain.gain.value = 0.38;
    this.officeGlassFilter = this.ctx.createBiquadFilter();
    this.officeGlassFilter.type = 'lowpass';
    this.officeGlassFilter.frequency.value = 365;
    this.officeGlassFilter.Q.value = 1.05;
    this.officePanner = this._makePanner(7.22, 0.68, 5.05, 2.0, 22, 1.35);

    this.officeGain.connect(this.officeGlassFilter);
    this.officeGlassFilter.connect(this.officePanner);
    this.officePanner.connect(this.masterGain);
    this.officePanner.connect(this.reverbSendGain);

    // 4. Exterior Paulden Arizona Sunset Desert Breeze at (0.0, 1.4, 24.5)
    this.desertGain = this.ctx.createGain();
    this.desertGain.gain.value = 0.16;
    this.desertPanner = this._makePanner(0.0, 1.4, 24.5, 4.5, 34, 1.1);
    const breezeSrc = this.ctx.createBufferSource();
    breezeSrc.buffer = this._noiseBuf;
    breezeSrc.loop = true;
    const breezeFilter = this.ctx.createBiquadFilter();
    breezeFilter.type = 'bandpass';
    breezeFilter.frequency.value = 420;
    breezeFilter.Q.value = 0.7;
    breezeSrc.connect(breezeFilter);
    breezeFilter.connect(this.desertGain);
    this.desertGain.connect(this.desertPanner);
    this.desertPanner.connect(this.masterGain);
    breezeSrc.start();

    // 5. Tony Bjork Master Builder Tribute Easter Egg: Warm 42Hz V-Twin Custom-Chopper Idle Purr at (9.75, 1.28, 4.58)!
    // Filter BEFORE HRTF panning (`vTwinGain -> vTwinGlassFilter -> vTwinChopperPanner -> masterGain`) so HRTF stereo never downmixes!
    this.vTwinChopperPanner = this._makePanner(9.75, 1.28, 4.58, 0.9, 6.5, 2.2);
    this.vTwinGlassFilter = this.ctx.createBiquadFilter();
    this.vTwinGlassFilter.type = 'lowpass';
    this.vTwinGlassFilter.frequency.value = 365;
    this.vTwinGlassFilter.Q.value = 0.9;
    const vTwinOscA = this.ctx.createOscillator();
    const vTwinOscB = this.ctx.createOscillator();
    const vTwinLfo = this.ctx.createOscillator();
    const vTwinLfoGain = this.ctx.createGain();
    const vTwinFilter = this.ctx.createBiquadFilter();
    const vTwinGain = this.ctx.createGain();
    vTwinOscA.type = 'triangle';
    vTwinOscA.frequency.value = 42.0; // Potato-potato V-twin fundamental
    vTwinOscB.type = 'sawtooth';
    vTwinOscB.frequency.value = 84.5;
    vTwinLfo.type = 'sine';
    vTwinLfo.frequency.value = 6.2; // Classic uneven V-twin lope cadence
    vTwinLfoGain.gain.value = 0.016;
    vTwinFilter.type = 'lowpass';
    vTwinFilter.frequency.value = 155;
    vTwinGain.gain.value = 0.028;
    vTwinLfo.connect(vTwinLfoGain);
    vTwinLfoGain.connect(vTwinGain.gain);
    vTwinOscA.connect(vTwinFilter);
    vTwinOscB.connect(vTwinFilter);
    vTwinFilter.connect(vTwinGain);
    vTwinGain.connect(this.vTwinGlassFilter);
    this.vTwinGlassFilter.connect(this.vTwinChopperPanner);
    this.vTwinChopperPanner.connect(this.masterGain);
    this.vTwinChopperPanner.connect(this.reverbSendGain);
    vTwinOscA.start();
    vTwinOscB.start();
    vTwinLfo.start();
  }

  updateListener(pos, forward, up, doorOpen = false, elapsedSec = 0) {
    // Compute WDI "The Dook" Transition Portal acoustic zone, reverb wetness & glass occlusion!
    const insideOffice = pos.x >= 5.02 && pos.x <= 9.98 && pos.z >= 3.60 && pos.z <= 6.96 && pos.y <= 2.35;
    const inAirlock = Math.abs(pos.x) <= 5.2 && pos.z >= 16.0 && pos.z <= 19.3 && pos.y <= 4.2;
    const outsideLot = pos.z > 19.3;

    let targetCutoff = 365;
    if (insideOffice) {
      targetCutoff = 16000;
    } else if (doorOpen) {
      const distDoor = Math.hypot(pos.x - 5.85, pos.z - 6.95);
      targetCutoff = distDoor < 4.5 ? 4200 : 1450;
    }

    let targetReverbWet = 0.34; // High-bay cathedral pit reverb (34% wet)
    let zoneKey = 'cathedral_bay';
    let zoneLabel = doorOpen
      ? 'CATHEDRAL BAY (REVERB 34% • DOOR OPEN)'
      : 'CATHEDRAL BAY (REVERB 34% • GLASS 365Hz)';

    if (insideOffice) {
      targetReverbWet = 0.10; // Damped walnut/glass office
      zoneKey = 'office_01';
      zoneLabel = 'OFFICE 01 (DAMPED 10% • FULL 16kHz)';
    } else if (inAirlock) {
      targetReverbWet = 0.40; // Echoing steel RFID airlock vestibule ("The Dook"!)
      zoneKey = 'rfid_airlock';
      zoneLabel = 'RFID AIRLOCK PORTAL (ECHO 40% • DOOK)';
    } else if (outsideLot) {
      targetReverbWet = 0.04; // Open-air Yavapai desert lot
      zoneKey = 'arizona_lot';
      zoneLabel = 'PAULDEN LOT 86334 (DRY OPEN AIR 4%)';
    }

    this.acousticState.insideOffice = insideOffice;
    this.acousticState.inAirlock = inAirlock;
    this.acousticState.outsideLot = outsideLot;
    this.acousticState.doorOpen = doorOpen;
    this.acousticState.cutoffHz = Math.round(targetCutoff);
    this.acousticState.reverbWet = targetReverbWet;
    this.acousticState.zoneKey = zoneKey;
    this.acousticState.zoneLabel = zoneLabel;

    // Update live 120 BPM visual VU levels
    const beatFloat = elapsedSec * (this.bpm / 60);
    const beatFrac = beatFloat - Math.floor(beatFloat);
    const kickEnv = beatFrac < 0.18 ? 1.0 : Math.exp(-(beatFrac - 0.18) * 7.5);
    for (let i = 0; i < 6; i++) {
      const wave = 0.55 + 0.45 * Math.sin(elapsedSec * (5.2 + i * 1.35) + i * 0.9);
      this.vuLevels[i] = Math.max(0.10, Math.min(1.0, kickEnv * wave));
    }

    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const l = this.ctx.listener;
    if (l.positionX) {
      l.positionX.setTargetAtTime(pos.x, now, 0.03);
      l.positionY.setTargetAtTime(pos.y, now, 0.03);
      l.positionZ.setTargetAtTime(pos.z, now, 0.03);
      l.forwardX.setTargetAtTime(forward.x, now, 0.03);
      l.forwardY.setTargetAtTime(forward.y, now, 0.03);
      l.forwardZ.setTargetAtTime(forward.z, now, 0.03);
      l.upX.setTargetAtTime(up.x, now, 0.03);
      l.upY.setTargetAtTime(up.y, now, 0.03);
      l.upZ.setTargetAtTime(up.z, now, 0.03);
    } else {
      l.setPosition(pos.x, pos.y, pos.z);
      l.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }

    if (this.officeGlassFilter) {
      this.officeGlassFilter.frequency.setTargetAtTime(targetCutoff, now, 0.08);
    }
    if (this.vTwinGlassFilter) {
      this.vTwinGlassFilter.frequency.setTargetAtTime(targetCutoff, now, 0.08);
    }
    if (this.reverbSendGain) {
      this.reverbSendGain.gain.setTargetAtTime(targetReverbWet, now, 0.12);
    }
  }

  getAcousticState() {
    return this.acousticState;
  }

  _scheduleTick() {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return;
    while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
      this._trigger16thStep(this.current16th, this.nextNoteTime);
      this.nextNoteTime += this.stepDur;
      this.current16th = (this.current16th + 1) % 32;
    }
  }

  _trigger16thStep(step, t) {
    const s16 = step % 16;

    // --- 1. VOLT 120 BPM ELECTRO-BOOGALOO BOOMBOX ---
    // Kick on 0, 4, 8, 10, 12
    if (s16 === 0 || s16 === 4 || s16 === 8 || s16 === 10 || s16 === 12) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(128, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.11);
      g.gain.setValueAtTime(0.42, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(g);
      g.connect(this.boomboxGain);
      osc.start(t);
      osc.stop(t + 0.15);
    }
    // Crisp electro snare/clap on 4 and 12
    if (s16 === 4 || s16 === 12) {
      this._burstNoise(this.boomboxGain, t, 0.085, 1450, 1.2, 0.24);
    }
    // Offbeat hi-hat ticks
    if (s16 % 2 === 1) {
      this._burstNoise(this.boomboxGain, t, 0.032, 6800, 2.2, 0.09);
    }
    // Funky slap-synth bassline (E minor pentatonic electro groove)
    const bassNotes = {
      0: 82.41,  // E2
      2: 82.41,
      3: 98.00,  // G2
      6: 110.00, // A2
      8: 82.41,  // E2
      11: 123.47,// B2
      13: 110.00,// A2
      14: 98.00, // G2
    };
    if (bassNotes[s16]) {
      const osc = this.ctx.createOscillator();
      const flt = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bassNotes[s16], t);
      flt.type = 'lowpass';
      flt.frequency.setValueAtTime(920, t);
      flt.frequency.exponentialRampToValueAtTime(220, t + 0.11);
      flt.Q.value = 3.5;
      g.gain.setValueAtTime(0.20, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(flt);
      flt.connect(g);
      g.connect(this.boomboxGain);
      osc.start(t);
      osc.stop(t + 0.13);
    }

    // --- 2. CONVEYOR ROLLER CLACKS ---
    if (step % 4 === 2) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340 + (step % 8) * 18, t);
      osc.frequency.exponentialRampToValueAtTime(95, t + 0.035);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(g);
      g.connect(this.conveyorGain);
      osc.start(t);
      osc.stop(t + 0.045);
    }

    // --- 3. FOREMAN BARITONE OFFICE RANT SYLLABLES (Filtered by officeGlassFilter!) ---
    // Speaks in expressive bursts for 20 steps, pauses 12 steps
    if (step < 20 && (step % 2 === 0 || step === 5 || step === 13)) {
      const f0 = 108 + ((step * 17) % 42);
      const osc = this.ctx.createOscillator();
      const form = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.linearRampToValueAtTime(f0 * (step === 18 ? 1.25 : 0.92), t + 0.09);
      form.type = 'bandpass';
      form.frequency.setValueAtTime(520 + ((step * 83) % 460), t);
      form.Q.value = 2.4;
      g.gain.setValueAtTime(0.28, t);
      g.gain.exponentialRampToValueAtTime(0.002, t + 0.10);
      osc.connect(form);
      form.connect(g);
      g.connect(this.officeGain);
      osc.start(t);
      osc.stop(t + 0.11);
    }
  }

  _burstNoise(dest, t, dur, freq, q, peakGain) {
    if (!this._noiseBuf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.value = freq;
    flt.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(peakGain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(dest);
    src.start(t, Math.random() * 0.4, dur + 0.02);
  }

  _oneShotPanner(pos) {
    if (!this.ctx || !this.enabled) return null;
    if (!pos) return this.masterGain;
    const p = this._makePanner(pos.x, pos.y || 0.5, pos.z, 2.5, 30, 1.15);
    p.connect(this.masterGain);
    if (this.reverbSendGain) p.connect(this.reverbSendGain);
    return p;
  }

  playRfidBeep(pos) {
    const out = this._oneShotPanner(pos);
    if (!out) return;
    const t = this.ctx.currentTime;
    for (const [off, hz] of [[0, 1180], [0.085, 1760]]) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(hz, t + off);
      g.gain.setValueAtTime(0.25, t + off);
      g.gain.exponentialRampToValueAtTime(0.001, t + off + 0.09);
      o.connect(g);
      g.connect(out);
      o.start(t + off);
      o.stop(t + off + 0.1);
    }
  }

  playElectricZap(pos) {
    const out = this._oneShotPanner(pos);
    if (!out) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, t);
    o.frequency.linearRampToValueAtTime(920, t + 0.08);
    o.frequency.linearRampToValueAtTime(140, t + 0.22);
    o.frequency.linearRampToValueAtTime(640, t + 0.36);
    g.gain.setValueAtTime(0.36, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    o.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + 0.44);
    this._burstNoise(out, t, 0.35, 3200, 1.4, 0.32);
  }

  playHandshakeCue(typeId, pos) {
    const out = this._oneShotPanner(pos);
    if (!out) return;
    const t = this.ctx.currentTime;
    if (typeId === 1) {
      // Executive clasp -> Electric spark burst!
      this._burstNoise(out, t, 0.06, 900, 1.8, 0.25);
      window.setTimeout(() => this.playElectricZap(pos), 520);
    } else if (typeId === 2) {
      // PJ-WA-WA 7-step Slap-Slide-Hook-Bump-Snap-Boom!
      const hits = [
        [0.00, 1400, 0.26], // Slap!
        [0.18, 650, 0.16],  // Slide!
        [0.34, 420, 0.22],  // Hook!
        [0.52, 220, 0.28],  // Fist-bump!
        [0.72, 2850, 0.26], // Finger-snap!
        [0.92, 180, 0.30],  // Boom firework!
      ];
      for (const [dt, hz, amp] of hits) {
        this._burstNoise(out, t + dt, 0.065, hz, 2.0, amp);
      }
      // Sparkle chime at boom
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(880, t + 0.92);
      o.frequency.exponentialRampToValueAtTime(1760, t + 1.22);
      g.gain.setValueAtTime(0.20, t + 0.92);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.25);
      o.connect(g);
      g.connect(out);
      o.start(t + 0.92);
      o.stop(t + 1.26);
    } else if (typeId === 3) {
      // Fake-Out Psych whoosh + hardhat tap
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(320, t + 0.22);
      o.frequency.exponentialRampToValueAtTime(860, t + 0.42);
      o.frequency.exponentialRampToValueAtTime(240, t + 0.62);
      g.gain.setValueAtTime(0.22, t + 0.22);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      o.connect(g);
      g.connect(out);
      o.start(t + 0.22);
      o.stop(t + 0.66);
    } else if (typeId === 4) {
      // Carl's Paper-Covers-Rock awkward thud + descending trombone-ish sad slide
      this._burstNoise(out, t + 0.25, 0.08, 380, 1.5, 0.26);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(293.66, t + 0.36);
      o.frequency.linearRampToValueAtTime(196.0, t + 0.78);
      g.gain.setValueAtTime(0.16, t + 0.36);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.80);
      o.connect(g);
      g.connect(out);
      o.start(t + 0.36);
      o.stop(t + 0.82);
    } else {
      // Tiny Giant-Fingertip dainty chime
      for (const [dt, hz] of [[0.20, 1318.5], [0.42, 1568.0]]) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(hz, t + dt);
        g.gain.setValueAtTime(0.18, t + dt);
        g.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.18);
        o.connect(g);
        g.connect(out);
        o.start(t + dt);
        o.stop(t + dt + 0.20);
      }
    }
  }

  playPortaPottyKnock(stage, pos) {
    const out = this._oneShotPanner(pos);
    if (!out) return;
    const t = this.ctx.currentTime;
    // 3 hollow plastic door knocks
    for (let i = 0; i < 3; i++) {
      const kt = t + i * 0.13;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(215 - i * 8, kt);
      o.frequency.exponentialRampToValueAtTime(88, kt + 0.06);
      g.gain.setValueAtTime(0.34, kt);
      g.gain.exponentialRampToValueAtTime(0.001, kt + 0.07);
      o.connect(g);
      g.connect(out);
      o.start(kt);
      o.stop(kt + 0.08);
    }
    // Long pneumatic *SSSSHHHHH* intake hiss from Anty inside!
    this._burstNoise(out, t + 0.46, 0.55 + Math.min(0.4, stage * 0.08), 2400, 1.8, 0.22);
  }

  playMustacheShave(pos) {
    const out = this._oneShotPanner(pos);
    if (!out) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(145, t);
    o.frequency.linearRampToValueAtTime(168, t + 0.22);
    o.frequency.linearRampToValueAtTime(138, t + 0.45);
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
    o.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + 0.50);
  }

  playCutawayClick(isPatented) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    if (isPatented) {
      // Crisp mechanical magazine catch lock CLICK!
      this._burstNoise(this.masterGain, t, 0.035, 3400, 2.5, 0.26);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(1046.5, t + 0.02);
      o.frequency.setValueAtTime(1318.5, t + 0.08);
      g.gain.setValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g);
      g.connect(this.masterGain);
      o.start(t + 0.02);
      o.stop(t + 0.24);
    } else {
      // Dull flat-steel stack-bind thud!
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(135, t);
      o.frequency.exponentialRampToValueAtTime(52, t + 0.12);
      g.gain.setValueAtTime(0.32, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(g);
      g.connect(this.masterGain);
      o.start(t);
      o.stop(t + 0.16);
    }
  }

  playDoorSwing(isOpen, pos) {
    const out = this._oneShotPanner(pos);
    if (!out) return;
    const t = this.ctx.currentTime;
    this._burstNoise(out, t, 0.16, isOpen ? 950 : 620, 1.4, 0.18);
  }

  playFootstep(pos, sprint = false, scale = 1.0) {
    const out = this._oneShotPanner(pos);
    if (!out) return;
    const t = this.ctx.currentTime;
    // Subtle servo heel-tap on epoxy concrete + swinging ID badge tick
    const pitchScale = scale > 1.3 ? 0.62 : 1.0;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime((sprint ? 168 : 138) * pitchScale, t);
    o.frequency.exponentialRampToValueAtTime(52 * pitchScale, t + 0.042);
    g.gain.setValueAtTime(sprint ? 0.14 : 0.095, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.048);
    o.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + 0.052);
    // Faint lanyard plastic badge click
    this._burstNoise(out, t + 0.012, 0.022, 3100, 2.4, sprint ? 0.055 : 0.032);
  }

  playAirHoseTrip(pos) {
    const out = this._oneShotPanner(pos);
    if (!out) return;
    const t = this.ctx.currentTime;
    // Pneumatic air-hose PSSSHHT + comical boot thud!
    this._burstNoise(out, t, 0.24, 2850, 1.5, 0.30);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, t + 0.04);
    o.frequency.exponentialRampToValueAtTime(68, t + 0.22);
    g.gain.setValueAtTime(0.24, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g);
    g.connect(out);
    o.start(t + 0.04);
    o.stop(t + 0.26);
  }

  // Ben Burtt *WALL-E* Emotive Servo Pitch Contours per Cast Member on `[E]` Talk!
  playCharacterVoiceContour(charId, pos) {
    const out = this._oneShotPanner(pos);
    if (!out) return;
    const t = this.ctx.currentTime;
    const profiles = {
      foreman: { wave: 'sawtooth', notes: [128, 152, 114], dur: 0.09, flt: 620 },
      carl: { wave: 'triangle', notes: [340, 465, 295, 420], dur: 0.065, flt: 1600 },
      pj_wawa: { wave: 'triangle', notes: [262, 330, 392, 523], dur: 0.06, flt: 2200 },
      athena: { wave: 'sine', notes: [587, 740, 880], dur: 0.065, flt: 2800 },
      dot: { wave: 'triangle', notes: [440, 523, 494], dur: 0.07, flt: 1900 },
      anty: { wave: 'sine', notes: [310, 370], dur: 0.14, flt: 1200 },
      instructor: { wave: 'sawtooth', notes: [164, 196, 174], dur: 0.095, flt: 880 },
      volt: { wave: 'square', notes: [330, 440, 659, 587], dur: 0.055, flt: 2400 },
      tiny: { wave: 'triangle', notes: [92, 110, 98], dur: 0.12, flt: 480 },
      lou: { wave: 'sawtooth', notes: [220, 277, 246], dur: 0.075, flt: 1350 },
    };
    const p = profiles[charId] || profiles.dot;
    p.notes.forEach((freq, idx) => {
      const st = t + idx * (p.dur * 0.92);
      const o = this.ctx.createOscillator();
      const f = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();
      o.type = p.wave;
      o.frequency.setValueAtTime(freq * 0.92, st);
      o.frequency.exponentialRampToValueAtTime(freq * 1.06, st + p.dur * 0.55);
      o.frequency.exponentialRampToValueAtTime(freq * 0.96, st + p.dur);
      f.type = 'lowpass';
      f.frequency.value = p.flt;
      g.gain.setValueAtTime(0.001, st);
      g.gain.linearRampToValueAtTime(0.14, st + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, st + p.dur);
      o.connect(f);
      f.connect(g);
      g.connect(out);
      o.start(st);
      o.stop(st + p.dur + 0.01);
    });
  }

  // V8 Tactile Prop Bump SFX (cones, spilled sockets, magazines, rattling carts)
  playPropBump(kind = 'cone', pos = null) {
    const out = this._oneShotPanner(pos);
    if (!out || !this.ctx) return;
    const t = this.ctx.currentTime;
    if (kind === 'socket' || kind === 'metal') {
      [1380, 2140].forEach((freq, i) => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, t + i * 0.014);
        o.frequency.exponentialRampToValueAtTime(freq * 0.72, t + 0.09 + i * 0.014);
        g.gain.setValueAtTime(0.11, t + i * 0.014);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.11 + i * 0.014);
        o.connect(g);
        g.connect(out);
        o.start(t + i * 0.014);
        o.stop(t + 0.12 + i * 0.014);
      });
    } else if (kind === 'cart') {
      this._burstNoise(out, t, 0.14, 920, 1.2, 0.16);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(165, t);
      o.frequency.exponentialRampToValueAtTime(92, t + 0.14);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + 0.16);
    } else if (kind === 'paper' || kind === 'magazine') {
      this._burstNoise(out, t, 0.08, 1950, 0.9, 0.12);
    } else {
      // Hollow rubber safety cone thump
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(148, t);
      o.frequency.exponentialRampToValueAtTime(58, t + 0.10);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + 0.12);
    }
  }

  // V8 Ep.3 Giant Magazine 1-Finger Seat Latch Click ("ONE MORE CHANCE")
  playGiantMagSeatClick(pos = null) {
    const out = this._oneShotPanner(pos);
    if (!out || !this.ctx) return;
    const t = this.ctx.currentTime;
    // Crisp dual detent snap + sub-bass cabinet resonance
    this._burstNoise(out, t, 0.06, 2600, 1.8, 0.24);
    this._burstNoise(out, t + 0.075, 0.08, 1850, 2.2, 0.20);
    [540, 810, 118].forEach((freq, idx) => {
      const st = t + idx * 0.035;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = idx === 2 ? 'sine' : 'triangle';
      o.frequency.setValueAtTime(freq, st);
      o.frequency.exponentialRampToValueAtTime(freq * 0.65, st + 0.12);
      g.gain.setValueAtTime(idx === 2 ? 0.22 : 0.16, st);
      g.gain.exponentialRampToValueAtTime(0.001, st + 0.14);
      o.connect(g);
      g.connect(out);
      o.start(st);
      o.stop(st + 0.15);
    });
  }
}
