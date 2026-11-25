let audioContext;
let masterGain;
let muted = false;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = muted ? 0 : 0.12;
    masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

function playTone(frequency, duration, waveform = 'sine', volume = 0.22, delay = 0, slide = 0) {
  const context = getAudioContext();
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + slide), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(masterGain);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.015);
}

function playNoise(duration, volume = 0.08) {
  const context = getAudioContext();
  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let sample = 0; sample < frameCount; sample++) samples[sample] = (Math.random() * 2 - 1) * (1 - sample / frameCount);
  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = buffer;
  gain.gain.value = volume;
  source.connect(gain).connect(masterGain);
  source.start();
}

export function playChop() { playTone(165, 0.075, 'triangle', 0.32, 0, -65); }
export function playSizzle() { if (!muted) playNoise(0.22, 0.11); }
export function playDing() { playTone(760, 0.28, 'sine', 0.2, 0, 280); }
export function playCoin() { playTone(1080, 0.17, 'sine', 0.25); playTone(1460, 0.22, 'triangle', 0.19, 0.08); }
export function playError() { playTone(235, 0.3, 'sawtooth', 0.18, 0, -115); }
export function playServe() { playTone(660, 0.2, 'triangle', 0.2); playTone(880, 0.23, 'triangle', 0.19, 0.12); playTone(1190, 0.35, 'sine', 0.2, 0.25); }
export function playRush() { playTone(330, 0.4, 'sawtooth', 0.14, 0, 190); playTone(480, 0.4, 'triangle', 0.17, 0.16); }

export function setMuted(value) {
  muted = Boolean(value);
  if (masterGain && audioContext) {
    masterGain.gain.setTargetAtTime(muted ? 0 : 0.12, audioContext.currentTime, 0.015);
  }
  return muted;
}

export function toggleMuted() { return setMuted(!muted); }
export function isMuted() { return muted; }
