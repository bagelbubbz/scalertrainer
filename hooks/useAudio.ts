'use client';
import { useRef, useCallback, useEffect } from 'react';

// ─── Shared AudioContext ────────────────────────────────────────────────────────
let _ctx: AudioContext | null = null;

export function getCtx(): AudioContext {
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ─── Guitar note: triangle fundamental + sawtooth harmonic + noise pick attack ─
export function playNoteRaw(
  midiNote: number,
  duration = 0.55,
  vol = 0.28
): void {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const freq = midiToFreq(midiNote);

    // Master gain with natural envelope
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(vol, now + 0.005);
    master.gain.exponentialRampToValueAtTime(vol * 0.4, now + 0.08);
    master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    master.connect(ctx.destination);

    // Osc 1: triangle — warm fundamental
    const o1 = ctx.createOscillator();
    o1.type = 'triangle';
    o1.frequency.setValueAtTime(freq, now);
    o1.frequency.exponentialRampToValueAtTime(freq * 0.999, now + duration);
    const g1 = ctx.createGain();
    g1.gain.value = 1.0;
    o1.connect(g1); g1.connect(master);
    o1.start(now); o1.stop(now + duration + 0.05);

    // Osc 2: sawtooth — bright pick attack (2nd harmonic, fades fast)
    const o2 = ctx.createOscillator();
    o2.type = 'sawtooth';
    o2.frequency.setValueAtTime(freq * 2, now);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.3, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    o2.connect(g2); g2.connect(master);
    o2.start(now); o2.stop(now + 0.15);

    // Noise burst for pick transient
    const bufLen = Math.floor(ctx.sampleRate * 0.025);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'bandpass';
    lpf.frequency.value = freq * 3;
    lpf.Q.value = 1.5;
    const gn = ctx.createGain();
    gn.gain.value = 0.15;
    noise.connect(lpf); lpf.connect(gn); gn.connect(master);
    noise.start(now); noise.stop(now + 0.025);
  } catch (e) {
    console.warn('Audio error:', e);
  }
}

// ─── Metronome click ────────────────────────────────────────────────────────────
export function playClickRaw(isAccent = false): void {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = isAccent ? 1100 : 880;
    g.gain.setValueAtTime(isAccent ? 0.12 : 0.06, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now + 0.04);
  } catch (e) {}
}

// ─── Chord playback ─────────────────────────────────────────────────────────────
export function playChordRaw(rootSemitone: number, intervals: number[], baseOctave = 4): void {
  const baseMidi = 60 + rootSemitone + (baseOctave - 4) * 12;
  intervals.slice(0, 3).forEach((iv, i) => {
    setTimeout(() => playNoteRaw(baseMidi + iv, 1.2, 0.2), i * 60);
  });
}

// ─── Hook ───────────────────────────────────────────────────────────────────────
export function useAudio() {
  const schedulerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunningRef = useRef(false);
  const bpmRef = useRef(80);
  const onBeatRef = useRef<((beat: number) => void) | null>(null);
  const soundOnRef = useRef(true);
  const clickOnRef = useRef(true);

  const unlockAudio = useCallback(() => {
    try { getCtx(); } catch (e) {}
  }, []);

  const playNote = useCallback((midi: number, duration = 0.55, vol = 0.28) => {
    if (soundOnRef.current) playNoteRaw(midi, duration, vol);
  }, []);

  const playClick = useCallback((isAccent = false) => {
    if (clickOnRef.current) playClickRaw(isAccent);
  }, []);

  const playChord = useCallback((rootSemitone: number, intervals: number[]) => {
    playChordRaw(rootSemitone, intervals);
  }, []);

  // Simple sequential step scheduler (not pre-scheduled — fires on setTimeout like original)
  const startSequencer = useCallback((
    bpm: number,
    onStep: (beat: number) => void
  ) => {
    isRunningRef.current = true;
    bpmRef.current = bpm;
    onBeatRef.current = onStep;
  }, []);

  const stopSequencer = useCallback(() => {
    isRunningRef.current = false;
    onBeatRef.current = null;
    if (schedulerRef.current) {
      clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
  }, []);

  const setSoundOn = useCallback((v: boolean) => { soundOnRef.current = v; }, []);
  const setClickOn = useCallback((v: boolean) => { clickOnRef.current = v; }, []);

  useEffect(() => () => stopSequencer(), [stopSequencer]);

  return { playNote, playClick, playChord, unlockAudio, startSequencer, stopSequencer, setSoundOn, setClickOn };
}
