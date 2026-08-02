(function attachEscapeBagelTheme(global) {
  'use strict';

  function midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function noteToMidi(name) {
    var map = {
      C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
      'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
    };
    var match = /^([A-G](?:#|b)?)(-?\d)$/.exec(name);
    if (!match) {
      return 60;
    }
    return (parseInt(match[2], 10) + 1) * 12 + map[match[1]];
  }

  function noteToFrequency(name) {
    return midiToFrequency(noteToMidi(name));
  }

  function createNoiseBuffer(context) {
    var buffer = context.createBuffer(1, context.sampleRate * 0.25, context.sampleRate);
    var data = buffer.getChannelData(0);
    var i;
    for (i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function createDriveCurve(amount) {
    var samples = 256;
    var curve = new Float32Array(samples);
    var i;
    var x;
    var k = typeof amount === 'number' ? amount : 18;
    for (i = 0; i < samples; i += 1) {
      x = i * 2 / samples - 1;
      curve[i] = (1 + k) * x / (1 + k * Math.abs(x));
    }
    return curve;
  }

  function EscapeBagelThemePlayer() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicBus = null;
    this.rafId = 0;
    this.isPlaying = false;
    this.nextStepTime = 0;
    this.currentStep = 0;
    this.noiseBuffer = null;
    this.tempo = 132;
    this.lookAhead = 0.18;
    this.loopSteps = 16;
    this.stepLength = 60 / this.tempo / 4;
    this.patterns = {
      lead: [
        'E5', null, 'G5', null, 'B5', null, 'G5', null,
        'D5', null, 'E5', null, 'G5', 'B5', 'D6', null
      ],
      bass: [
        'E2', null, 'E2', null, 'G2', null, 'B2', null,
        'D2', null, 'D2', null, 'A2', null, 'B2', null
      ],
      pad: [
        ['E4', 'G4', 'B4'], null, null, null,
        ['C4', 'E4', 'G4'], null, null, null,
        ['D4', 'F#4', 'A4'], null, null, null,
        ['B3', 'D4', 'F#4'], null, null, null
      ],
      kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
      snare: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      hat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      sparkle: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0]
    };
  }

  EscapeBagelThemePlayer.prototype.ensureAudio = function ensureAudio() {
    var context;
    var AudioCtor;
    var master;
    var compressor;
    var filter;
    var shaper;

    if (this.audioContext) {
      return;
    }

    AudioCtor = global.AudioContext || global['webkitAudioContext'];
    context = new AudioCtor();
    master = context.createGain();
    compressor = context.createDynamicsCompressor();
    filter = context.createBiquadFilter();
    shaper = context.createWaveShaper();

    filter.type = 'lowpass';
    filter.frequency.value = 4800;
    filter.Q.value = 0.6;

    compressor.threshold.value = -18;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.22;

    shaper.curve = createDriveCurve(8);
    shaper.oversample = '2x';

    master.gain.value = 0.16;

    master.connect(shaper);
    shaper.connect(filter);
    filter.connect(compressor);
    compressor.connect(context.destination);

    this.audioContext = context;
    this.masterGain = master;
    this.musicBus = master;
    this.noiseBuffer = createNoiseBuffer(context);
  };

  EscapeBagelThemePlayer.prototype.playKick = function playKick(time) {
    var context = this.audioContext;
    var osc = context.createOscillator();
    var gain = context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(132, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(0.85, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(this.musicBus);
    osc.start(time);
    osc.stop(time + 0.2);
  };

  EscapeBagelThemePlayer.prototype.playSnare = function playSnare(time) {
    var context = this.audioContext;
    var noise = context.createBufferSource();
    var filter = context.createBiquadFilter();
    var gain = context.createGain();
    var tone = context.createOscillator();
    var toneGain = context.createGain();

    noise.buffer = this.noiseBuffer;
    filter.type = 'highpass';
    filter.frequency.value = 1400;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(0.38, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    tone.type = 'triangle';
    tone.frequency.value = 180;
    toneGain.gain.setValueAtTime(0.001, time);
    toneGain.gain.exponentialRampToValueAtTime(0.2, time + 0.002);
    toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicBus);

    tone.connect(toneGain);
    toneGain.connect(this.musicBus);

    noise.start(time);
    noise.stop(time + 0.14);
    tone.start(time);
    tone.stop(time + 0.1);
  };

  EscapeBagelThemePlayer.prototype.playHat = function playHat(time) {
    var context = this.audioContext;
    var noise = context.createBufferSource();
    var filter = context.createBiquadFilter();
    var gain = context.createGain();

    noise.buffer = this.noiseBuffer;
    filter.type = 'highpass';
    filter.frequency.value = 4500;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(0.08, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicBus);

    noise.start(time);
    noise.stop(time + 0.04);
  };

  EscapeBagelThemePlayer.prototype.playBass = function playBass(note, time, duration) {
    var context = this.audioContext;
    var osc = context.createOscillator();
    var sub = context.createOscillator();
    var filter = context.createBiquadFilter();
    var gain = context.createGain();
    var frequency = noteToFrequency(note);

    osc.type = 'square';
    sub.type = 'triangle';
    osc.frequency.value = frequency;
    sub.frequency.value = frequency * 0.5;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(620, time);
    filter.frequency.linearRampToValueAtTime(420, time + duration);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.16, time + 0.01);
    gain.gain.linearRampToValueAtTime(0.08, time + duration * 0.65);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicBus);

    osc.start(time);
    sub.start(time);
    osc.stop(time + duration + 0.05);
    sub.stop(time + duration + 0.05);
  };

  EscapeBagelThemePlayer.prototype.playLead = function playLead(note, time, duration) {
    var context = this.audioContext;
    var osc = context.createOscillator();
    var vibrato = context.createOscillator();
    var vibratoGain = context.createGain();
    var gain = context.createGain();
    var filter = context.createBiquadFilter();
    var frequency = noteToFrequency(note);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(frequency, time);

    vibrato.type = 'sine';
    vibrato.frequency.value = 6.5;
    vibratoGain.gain.value = 4;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, time);
    filter.frequency.linearRampToValueAtTime(1800, time + duration);
    filter.Q.value = 6;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.09, time + 0.015);
    gain.gain.linearRampToValueAtTime(0.045, time + duration * 0.55);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicBus);

    vibrato.start(time);
    osc.start(time);
    vibrato.stop(time + duration + 0.05);
    osc.stop(time + duration + 0.05);
  };

  EscapeBagelThemePlayer.prototype.playPad = function playPad(chord, time, duration) {
    var context = this.audioContext;
    var filter = context.createBiquadFilter();
    var gain = context.createGain();
    var oscillators = [];
    var i;
    var osc;

    filter.type = 'lowpass';
    filter.frequency.value = 1450;
    filter.Q.value = 1.2;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.05, time + 0.12);
    gain.gain.linearRampToValueAtTime(0.04, time + duration * 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    filter.connect(gain);
    gain.connect(this.musicBus);

    for (i = 0; i < chord.length; i += 1) {
      osc = context.createOscillator();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.value = noteToFrequency(chord[i]);
      osc.detune.value = i === 2 ? 5 : (i === 1 ? -5 : 0);
      osc.connect(filter);
      osc.start(time);
      osc.stop(time + duration + 0.06);
      oscillators.push(osc);
    }
  };

  EscapeBagelThemePlayer.prototype.playSparkle = function playSparkle(time) {
    var context = this.audioContext;
    var osc = context.createOscillator();
    var gain = context.createGain();
    var filter = context.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(noteToFrequency('B6'), time);
    osc.frequency.linearRampToValueAtTime(noteToFrequency('E7'), time + 0.08);

    filter.type = 'bandpass';
    filter.frequency.value = 2600;
    filter.Q.value = 8;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.045, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicBus);

    osc.start(time);
    osc.stop(time + 0.2);
  };

  EscapeBagelThemePlayer.prototype.scheduleStep = function scheduleStep(step, time) {
    var leadNote = this.patterns.lead[step];
    var bassNote = this.patterns.bass[step];
    var padChord = step % 4 === 0 ? this.patterns.pad[Math.floor(step / 4)] : null;

    if (this.patterns.kick[step]) {
      this.playKick(time);
    }
    if (this.patterns.snare[step]) {
      this.playSnare(time);
    }
    if (this.patterns.hat[step]) {
      this.playHat(time);
    }
    if (bassNote) {
      this.playBass(bassNote, time, this.stepLength * 1.9);
    }
    if (leadNote) {
      this.playLead(leadNote, time, this.stepLength * 1.2);
    }
    if (padChord) {
      this.playPad(padChord, time, this.stepLength * 3.8);
    }
    if (this.patterns.sparkle[step]) {
      this.playSparkle(time + 0.02);
    }
  };

  EscapeBagelThemePlayer.prototype.tick = function tick() {
    var self = this;
    if (!this.isPlaying || !this.audioContext) {
      return;
    }

    while (this.nextStepTime < this.audioContext.currentTime + this.lookAhead) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += this.stepLength;
      this.currentStep = (this.currentStep + 1) % this.loopSteps;
    }

    this.rafId = global.requestAnimationFrame(function () {
      self.tick();
    });
  };

  EscapeBagelThemePlayer.prototype.start = function start() {
    var self = this;
    this.ensureAudio();
    return this.audioContext.resume().then(function () {
      if (self.isPlaying) {
        return;
      }
      self.isPlaying = true;
      self.currentStep = 0;
      self.nextStepTime = self.audioContext.currentTime + 0.06;
      self.tick();
    });
  };

  EscapeBagelThemePlayer.prototype.stop = function stop() {
    if (!this.audioContext) {
      return;
    }
    this.isPlaying = false;
    if (this.rafId) {
      global.cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.masterGain.gain.cancelScheduledValues(this.audioContext.currentTime);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.audioContext.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.06);
    this.masterGain.gain.linearRampToValueAtTime(0.16, this.audioContext.currentTime + 0.12);
  };

  EscapeBagelThemePlayer.prototype.toggle = function toggle() {
    if (this.isPlaying) {
      this.stop();
      return Promise.resolve(false);
    }
    return this.start().then(function () {
      return true;
    });
  };

  global.ULEAP_Audio = global.ULEAP_Audio || {};
  global.ULEAP_Audio.createEscapeBagelThemePlayer = function createEscapeBagelThemePlayer() {
    return new EscapeBagelThemePlayer();
  };
})(window);
