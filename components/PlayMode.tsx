'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Fretboard from './Fretboard';
import {
  ScaleNote, ScaleType, ScaleDef, buildScale, buildSequence,
  getFretRange, NOTES, SCALES, OCTAVE_COLORS, PlayDirection, LabelMode, getLabel, STRING_LABELS,
} from '@/lib/musicTheory';
import { playNoteRaw, playClickRaw, getCtx } from '@/hooks/useAudio';
import { useGamification } from '@/store/gamification';

interface PlayModeProps {
  rootIdx: number;
  scaleType: ScaleType;
  scaleDef: ScaleDef;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  soundOn: boolean;
  clickOn: boolean;
  audioUnlocked: boolean;
  onUnlock: () => void;
  onRunComplete?: (xpGained: number) => void;
}

function xpFor(n: number) { return n * 10; }

export default function PlayMode({
  rootIdx, scaleType, scaleDef, bpm, onBpmChange,
  soundOn, clickOn, audioUnlocked, onUnlock, onRunComplete,
}: PlayModeProps) {
  const pos = buildScale(rootIdx, scaleType);
  const { frets } = getFretRange(pos);
  const { recordNote, recordPractice, addXp } = useGamification();

  const [dir, setDir] = useState<PlayDirection>('up');
  const [labelMode, setLabelMode] = useState<LabelMode>('solfege');
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState<number[]>([]);
  const beatRef = useRef(0);

  const allSteps = buildSequence(pos, dir);
  const allStepsRef = useRef(allSteps);
  allStepsRef.current = allSteps;

  // Reset on scale/root change
  useEffect(() => {
    setStep(-1); setDone([]); setPlaying(false);
  }, [rootIdx, scaleType]);

  // Playback engine — setTimeout-based, matches original
  useEffect(() => {
    if (!playing) return;
    const steps = allStepsRef.current;
    if (step >= steps.length) {
      // Run complete
      setPlaying(false); setStep(-1); setDone([]);
      const gained = xpFor(steps.length);
      addXp(gained);
      recordPractice();
      onRunComplete?.(gained);
      return;
    }
    const delay = (60 / bpm) * 1000;
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
  }, [playing, step, bpm, soundOn, clickOn, audioUnlocked]);

  const unlockAndPlay = () => {
    try { getCtx(); onUnlock(); } catch (e) {}
    beatRef.current = 0;
    setStep(0); setDone([]); setPlaying(true);
  };

  const stop = () => { setPlaying(false); setStep(-1); setDone([]); };

  const flat = pos.flat();
  const curNote = step >= 0 && step < allSteps.length ? allSteps[step] : null;
  const pct = allSteps.length ? Math.round((done.length / allSteps.length) * 100) : 0;
  const doneSet = new Set(done.map(i => allSteps[i]?.deg ?? -1));

  // Octave legend
  const octaveCounts = [0, 1, 2].map(o => flat.filter(n => n.oct === o).length);

  // Pattern strip: whole/half steps
  const ivs = SCALES[scaleType].intervals;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Controls: TEMPO full-width, then DIR + LABELS side by side */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Tempo — full width */}
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#555', letterSpacing: 1.5 }}>TEMPO</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#c8f025', lineHeight: 1 }}>{bpm} <span style={{ fontSize: 10, color: '#555' }}>BPM</span></span>
          </div>
          <input
            type="range" min={30} max={180} value={bpm}
            onChange={e => onBpmChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#c8f025' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
            <span style={{ fontSize: 9, color: '#333' }}>30</span>
            <span style={{ fontSize: 9, color: '#333' }}>180</span>
          </div>
        </div>

        {/* DIR + LABELS side by side */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="card" style={{ padding: '12px 10px', flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#555', letterSpacing: 1.5, marginBottom: 7 }}>DIRECTION</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {([['up','↑ Up'],['down','↓ Dn'],['updown','↕']] as [PlayDirection, string][]).map(([d, l]) => (
                <MiniBtn key={d} label={l} active={dir === d} onClick={() => { setDir(d); stop(); }} />
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '12px 10px', flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#555', letterSpacing: 1.5, marginBottom: 7 }}>LABELS</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {([['solfege','Do'],['note','A#'],['degree','1']] as [LabelMode, string][]).map(([m, l]) => (
                <MiniBtn key={m} label={l} active={labelMode === m} color="#25d4f0" onClick={() => setLabelMode(m)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Play button */}
      <button
        onClick={playing ? stop : unlockAndPlay}
        style={{
          width: '100%', padding: 15, borderRadius: 14, border: 'none',
          background: playing ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg,#c8f025 0%,#a8d010 100%)',
          color: playing ? '#888' : '#0d0f1a',
          fontWeight: 900, fontSize: 17, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: playing ? 'none' : '0 6px 24px rgba(200,240,37,0.28)',
          transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        {playing ? '⏹ Stop' : `▶ Play — ${NOTES[rootIdx]} ${scaleDef.name}`}
      </button>

      {/* Audio unlock tip */}
      {!audioUnlocked && (
        <div style={{
          textAlign: 'center', fontSize: 11, color: '#ff7c2a',
          padding: '8px 14px', background: 'rgba(255,124,42,0.08)',
          borderRadius: 8, border: '1px solid rgba(255,124,42,0.2)',
        }}>
          👆 Tap Play to unlock audio on your device
        </div>
      )}

      {/* Progress bar */}
      {(playing || done.length > 0) && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#555', fontWeight: 700 }}>Progress</span>
            <span style={{ fontSize: 11, color: '#c8f025', fontWeight: 800 }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg,#c8f025,#25d4f0)',
              width: `${pct}%`,
              transition: 'width 0.2s',
              borderRadius: 3,
            }} />
          </div>
        </div>
      )}

      {/* Active note card */}
      <div style={{ minHeight: 68 }}>
        {curNote ? (
          <ActiveNoteCard note={curNote} totalSteps={allSteps.length} stepIdx={step} labelMode={labelMode} />
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '14px 16px',
          }}>
            <span style={{ fontSize: 22 }}>🎸</span>
            <div style={{ fontSize: 12, color: '#444' }}>Tap Play to start · notes will light up and play</div>
          </div>
        )}
      </div>

      {/* Octave legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[0,1,2].map(o => {
          const c = octaveCounts[o];
          if (!c) return null;
          const col = OCTAVE_COLORS[o];
          return (
            <div key={o} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: `${col}0c`, border: `1px solid ${col}2a`,
              borderRadius: 7, padding: '3px 9px',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: col }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: col }}>Oct {o + 1}</span>
              <span style={{ fontSize: 9, color: '#444' }}>{c} notes</span>
            </div>
          );
        })}
      </div>

      {/* Fretboard */}
      <Fretboard
        pos={pos}
        frets={frets}
        activeNote={curNote}
        doneSet={doneSet}
        onNoteClick={n => { try { getCtx(); onUnlock(); } catch (e) {} playNoteRaw(n.midi, 0.6); }}
        labelMode={labelMode}
      />

      {/* Pattern strip */}
      <div style={{
        display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center',
        padding: '10px 14px', background: 'rgba(255,255,255,0.02)',
        borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: '#444', letterSpacing: 1.5, marginRight: 4 }}>PATTERN</span>
        {ivs.slice(1).map((iv, i) => {
          const diff = iv - ivs[i];
          return (
            <div key={i} style={{
              padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800,
              background: diff === 1 ? 'rgba(37,212,240,0.08)' : 'rgba(200,240,37,0.06)',
              color: diff === 1 ? '#25d4f0' : '#c8f025',
              border: `1px solid ${diff === 1 ? '#25d4f030' : '#c8f02530'}`,
            }}>
              {diff === 1 ? 'S' : 'T'}
            </div>
          );
        })}
        <span style={{ fontSize: 9, color: '#333', marginLeft: 4 }}>S=semitone T=tone</span>
      </div>
    </div>
  );
}

// ─── Active Note Card ──────────────────────────────────────────────────────────
function ActiveNoteCard({ note, totalSteps, stepIdx, labelMode }: {
  note: ScaleNote; totalSteps: number; stepIdx: number; labelMode: LabelMode;
}) {
  const oc = OCTAVE_COLORS[Math.min(note.oct, 2)];
  const lbl = getLabel(note, labelMode);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(255,255,255,0.03)', borderRadius: 14,
      padding: '12px 16px', border: `1px solid ${oc}33`,
    }}>
      <div
        key={note.deg}
        style={{
          width: 56, height: 56, borderRadius: 14,
          background: `${oc}18`, border: `2px solid ${oc}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          animation: 'popIn 0.18s ease',
        }}
      >
        <span style={{ fontSize: lbl.length > 2 ? 11 : 18, fontWeight: 900, color: oc, lineHeight: 1 }}>{lbl}</span>
        <span style={{ fontSize: 8, color: '#555', marginTop: 1 }}>{NOTES[note.note]}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>
          {note.sol} <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>({NOTES[note.note]})</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
          {[
            { l: 'String', v: STRING_LABELS[note.si] },
            { l: 'Fret',   v: note.fret },
            { l: 'Oct',    v: note.oct + 1, c: oc },
            { l: 'Note',   v: `${stepIdx + 1}/${totalSteps}` },
          ].map(({ l, v, c }) => (
            <span key={l} style={{
              background: 'rgba(255,255,255,0.05)', borderRadius: 6,
              padding: '2px 8px', fontSize: 11,
            }}>
              <span style={{ color: '#444' }}>{l} </span>
              <span style={{ color: c ?? '#ccc', fontWeight: 800 }}>{v}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Mini button ───────────────────────────────────────────────────────────────
function MiniBtn({ label, active, color = '#c8f025', onClick }: {
  label: string; active: boolean; color?: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 10px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
      background: active ? `${color}18` : 'rgba(255,255,255,0.05)',
      color: active ? color : '#666',
      border: `1px solid ${active ? `${color}55` : 'rgba(255,255,255,0.08)'}`,
      fontWeight: 700, fontSize: 12, fontFamily: 'inherit', transition: 'all 0.15s',
    }}>
      {label}
    </button>
  );
}
