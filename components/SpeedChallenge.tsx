'use client';
import { useState, useEffect, useRef } from 'react';
import Fretboard from './Fretboard';
import {
  ScaleType, ScaleDef, buildScale, buildSequence, getFretRange, NOTES,
} from '@/lib/musicTheory';
import { playNoteRaw, playClickRaw, getCtx } from '@/hooks/useAudio';
import { useGamification } from '@/store/gamification';

interface SpeedChallengeProps {
  rootIdx: number;
  scaleType: ScaleType;
  scaleDef: ScaleDef;
  soundOn: boolean;
  clickOn: boolean;
  audioUnlocked: boolean;
  onUnlock: () => void;
}

const START_BPM = 60;

export default function SpeedChallenge({
  rootIdx, scaleType, scaleDef, soundOn, clickOn, audioUnlocked, onUnlock,
}: SpeedChallengeProps) {
  const pos = buildScale(rootIdx, scaleType);
  const { frets } = getFretRange(pos);
  const { addXp, recordBpm, recordPractice } = useGamification();

  const [speedBpm, setSpeedBpm] = useState(START_BPM);
  const [speedBest, setSpeedBest] = useState(0);
  const [speedActive, setSpeedActive] = useState(false);
  const [playing, setPlaying]   = useState(false);
  const [step, setStep]         = useState(-1);
  const [done, setDone]         = useState<number[]>([]);
  const beatRef   = useRef(0);
  const bpmRef    = useRef(START_BPM);
  const bestRef   = useRef(0);

  const allSteps = buildSequence(pos, 'up');
  const allStepsRef = useRef(allSteps);
  allStepsRef.current = allSteps;

  useEffect(() => { setStep(-1); setDone([]); setPlaying(false); }, [rootIdx, scaleType]);

  // Playback engine
  useEffect(() => {
    if (!playing) return;
    const steps = allStepsRef.current;
    if (step >= steps.length) {
      // Run complete → bump BPM
      const newBpm = Math.min(bpmRef.current + 5, 220);
      bpmRef.current = newBpm;
      setSpeedBpm(newBpm);
      const gained = steps.length * 10;
      addXp(gained);
      recordPractice();
      if (newBpm > bestRef.current) {
        bestRef.current = newBpm;
        setSpeedBest(newBpm);
        recordBpm(newBpm);
      }
      setStep(0); setDone([]);
      return;
    }
    const delay = (60 / bpmRef.current) * 1000;
    const timer = setTimeout(() => {
      const n = steps[step];
      if (n && audioUnlocked) {
        if (soundOn) playNoteRaw(n.midi, Math.min(delay / 1000 * 0.85, 0.7));
        if (clickOn) playClickRaw(beatRef.current % 4 === 0);
        beatRef.current++;
      }
      setDone(prev => [...prev, step]);
      setStep(prev => prev + 1);
    }, delay);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, step, soundOn, clickOn, audioUnlocked]);

  const unlockAndPlay = () => {
    try { getCtx(); onUnlock(); } catch (e) {}
    bpmRef.current = speedBpm;
    beatRef.current = 0;
    setStep(0); setDone([]); setPlaying(true); setSpeedActive(true);
  };

  const stop = () => {
    setPlaying(false); setStep(-1); setDone([]); setSpeedActive(false);
  };

  const reset = () => {
    stop();
    bpmRef.current = START_BPM;
    bestRef.current = 0;
    setSpeedBpm(START_BPM);
    setSpeedBest(0);
  };

  const flat = pos.flat();
  const curNote = step >= 0 && step < allSteps.length ? allSteps[step] : null;
  const doneSet = new Set(done.map(i => allSteps[i]?.deg ?? -1));
  const pct = allSteps.length ? Math.round((done.length / allSteps.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Speed stats card */}
      <div className="card">
        <div style={{ fontWeight: 800, color: '#c8f025', marginBottom: 4 }}>⚡ Speed Challenge</div>
        <div style={{ fontSize: 12, color: '#555', marginBottom: 18 }}>
          Complete a run → BPM auto-increases +5. How fast can you go?
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{
            flex: 1, background: 'rgba(200,240,37,0.06)',
            border: '1px solid rgba(200,240,37,0.15)',
            borderRadius: 12, padding: 14, textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#c8f025' }}>{speedBpm}</div>
            <div style={{ fontSize: 9, color: '#666', fontWeight: 700 }}>CURRENT BPM</div>
          </div>
          <div style={{
            flex: 1, background: 'rgba(37,212,240,0.06)',
            border: '1px solid rgba(37,212,240,0.15)',
            borderRadius: 12, padding: 14, textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#25d4f0' }}>{speedBest || '—'}</div>
            <div style={{ fontSize: 9, color: '#666', fontWeight: 700 }}>BEST BPM</div>
          </div>
        </div>

        {/* Speed bar */}
        <div style={{ height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg,#c8f025,#ff7c2a,#ff5050)',
            borderRadius: 3,
            width: `${Math.min(speedBpm / 220 * 100, 100)}%`,
            transition: 'width 0.5s',
          }} />
        </div>

        {/* Progress during run */}
        {playing && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: '#555' }}>Run progress</span>
              <span style={{ fontSize: 10, color: '#c8f025' }}>{pct}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#c8f025', width: `${pct}%`, transition: 'width 0.1s' }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {!playing ? (
            <button
              onClick={unlockAndPlay}
              style={{
                flex: 1, padding: 13, borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg,#c8f025,#a8d010)',
                color: '#0d0f1a', fontWeight: 900, fontSize: 15,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              ▶ Start
            </button>
          ) : (
            <button
              onClick={stop}
              style={{
                flex: 1, padding: 13, borderRadius: 12,
                border: '1px solid rgba(255,80,80,0.3)',
                background: 'rgba(255,80,80,0.08)',
                color: '#ff5050', fontWeight: 900, fontSize: 15,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              ⏹ Stop
            </button>
          )}
          <button
            onClick={reset}
            style={{
              padding: '13px 16px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              color: '#666', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Best BPM badge */}
      {speedBest > 0 && (
        <div style={{
          background: 'rgba(255,124,42,0.07)',
          border: '1px solid rgba(255,124,42,0.2)',
          borderRadius: 12, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 24 }}>🏆</span>
          <div>
            <div style={{ fontWeight: 900, color: '#ff7c2a', fontSize: 15 }}>Best: {speedBest} BPM</div>
            <div style={{ fontSize: 11, color: '#666' }}>
              {speedBest < 80 ? 'Keep going!' : speedBest < 120 ? 'Solid!' : speedBest < 160 ? 'Impressive!' : '🔥 Shredding!'}
            </div>
          </div>
        </div>
      )}

      {/* Fretboard */}
      <Fretboard
        pos={pos}
        frets={frets}
        activeNote={curNote}
        doneSet={doneSet}
        labelMode="solfege"
      />
    </div>
  );
}
