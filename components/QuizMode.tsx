'use client';
import { useState, useCallback } from 'react';
import {
  ScaleNote, ScaleType, ScaleDef, buildScale, NOTES, SOLFEGE, STRING_LABELS,
} from '@/lib/musicTheory';
import { playNoteRaw, getCtx } from '@/hooks/useAudio';
import { useGamification } from '@/store/gamification';

interface QuizModeProps {
  rootIdx: number;
  scaleType: ScaleType;
  scaleDef: ScaleDef;
  audioUnlocked: boolean;
  onUnlock: () => void;
}

export default function QuizMode({ rootIdx, scaleType, audioUnlocked, onUnlock }: QuizModeProps) {
  const pos = buildScale(rootIdx, scaleType);
  const flat = pos.flat();
  const { recordQuizAnswer } = useGamification();

  const [qNote, setQNote] = useState<ScaleNote | null>(null);
  const [qOpts, setQOpts] = useState<string[]>([]);
  const [qAns, setQAns] = useState<string | null>(null);
  const [score, setScore] = useState({ c: 0, t: 0 });
  const [qStreak, setQStreak] = useState(0);

  const genQuiz = useCallback(() => {
    const all = buildScale(rootIdx, scaleType).flat();
    if (!all.length) return;
    const pick = all[Math.floor(Math.random() * all.length)];
    setQNote(pick); setQAns(null);
    const wrong = [...SOLFEGE]
      .filter(s => s !== pick.sol)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    setQOpts([pick.sol, ...wrong].sort(() => Math.random() - 0.5));
  }, [rootIdx, scaleType]);

  const handleQuiz = (ans: string) => {
    if (qAns !== null || !qNote) return;
    setQAns(ans);
    const correct = ans === qNote.sol;
    recordQuizAnswer(correct);
    if (correct) {
      setScore(s => ({ c: s.c + 1, t: s.t + 1 }));
      setQStreak(s => s + 1);
      try { getCtx(); onUnlock(); playNoteRaw(qNote.midi, 0.5); } catch (e) {}
    } else {
      setScore(s => ({ ...s, t: s.t + 1 }));
      setQStreak(0);
    }
    setTimeout(genQuiz, 1100);
  };

  const accuracy = score.t > 0 ? Math.round((score.c / score.t) * 100) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Stats row */}
      {score.t > 0 && (
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { l: 'ACCURACY', v: accuracy !== null ? `${accuracy}%` : '—', c: '#c8f025' },
            { l: 'CORRECT',  v: `${score.c}/${score.t}`,                  c: '#fff' },
            { l: 'STREAK',   v: `🔥${qStreak}`,                           c: '#ff7c2a' },
          ].map(({ l, v, c }) => (
            <div key={l} style={{
              flex: 1, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '12px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: c }}>{v}</div>
              <div style={{ fontSize: 9, color: '#555', fontWeight: 700, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Question card */}
      {qNote ? (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: 18,
        }}>
          <div style={{ fontSize: 11, color: '#555', fontWeight: 700, marginBottom: 12, letterSpacing: 1 }}>
            WHAT SOLFEGE IS THIS?
          </div>

          {/* Note info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18,
            padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'rgba(200,240,37,0.08)', border: '2px solid rgba(200,240,37,0.25)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#c8f025', lineHeight: 1 }}>{qNote.fret}</span>
              <span style={{ fontSize: 8, color: '#555' }}>fret</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                {STRING_LABELS[qNote.si]} string
              </div>
              <div style={{ fontSize: 11, color: '#555' }}>
                Note: <span style={{ color: '#aaa', fontWeight: 700 }}>{NOTES[qNote.note]}</span>
              </div>
            </div>
            <button
              onClick={() => { try { getCtx(); onUnlock(); playNoteRaw(qNote.midi, 0.6); } catch (e) {} }}
              style={{
                marginLeft: 'auto', background: 'rgba(37,212,240,0.08)',
                border: '1px solid rgba(37,212,240,0.2)', borderRadius: 8,
                padding: '6px 10px', cursor: 'pointer', color: '#25d4f0',
                fontWeight: 700, fontSize: 11, fontFamily: 'inherit',
              }}
            >
              🔊 Hear
            </button>
          </div>

          {/* Options grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {qOpts.map(opt => {
              const correct = opt === qNote.sol;
              const chosen  = qAns === opt;
              let bg     = 'rgba(255,255,255,0.05)';
              let border = 'rgba(255,255,255,0.1)';
              let col    = '#ccc';
              if (qAns !== null) {
                if (correct)       { bg = 'rgba(200,240,37,0.14)'; border = '#c8f025'; col = '#c8f025'; }
                else if (chosen)   { bg = 'rgba(255,70,70,0.1)';   border = 'rgba(255,70,70,0.4)'; col = '#ff5555'; }
              }
              return (
                <button
                  key={opt}
                  onClick={() => handleQuiz(opt)}
                  style={{
                    padding: '14px 8px', borderRadius: 11,
                    border: `1px solid ${border}`, background: bg, color: col,
                    fontWeight: 800, fontSize: 15, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                    animation: qAns !== null && correct ? 'correctFlash 0.5s ease'
                             : qAns === opt && !correct ? 'wrongShake 0.3s ease' : 'none',
                  }}
                >
                  {correct && qAns !== null ? '✓ ' : ''}{opt}
                </button>
              );
            })}
          </div>

          <button
            onClick={genQuiz}
            style={{
              marginTop: 10, padding: 10, width: '100%', borderRadius: 9,
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.03)', color: '#555',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
            }}
          >
            Skip →
          </button>
        </div>
      ) : (
        <button
          onClick={genQuiz}
          style={{
            padding: 14, borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg,#c8f025,#a8d010)',
            color: '#0d0f1a', fontWeight: 900, fontSize: 15,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          🧠 Start Quiz
        </button>
      )}

      <p style={{ fontSize: 11, color: '#444', textAlign: 'center' }}>
        +20 XP per correct answer · quiz adapts to your current scale &amp; key
      </p>
    </div>
  );
}
