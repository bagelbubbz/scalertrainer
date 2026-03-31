'use client';
import React from 'react';
import {
  ScaleNote, ScaleDef, STRING_LABELS, NOTES, OCTAVE_COLORS, LabelMode, getLabel,
} from '@/lib/musicTheory';

interface FretboardProps {
  pos: ScaleNote[][];          // [string][noteIdx]
  frets: number[];             // the windowed fret numbers to display
  activeNote?: ScaleNote | null;
  doneSet?: Set<number>;       // set of absolute deg indices that are done
  onNoteClick?: (n: ScaleNote) => void;
  labelMode?: LabelMode;
}

const INLAY_FRETS = new Set([3, 5, 7, 9, 15]);
const DOUBLE_FRETS = new Set([12]);

export default function Fretboard({
  pos,
  frets,
  activeNote,
  doneSet = new Set(),
  onNoteClick,
  labelMode = 'solfege',
}: FretboardProps) {
  // Build lookup map: "si-fret" → ScaleNote
  const noteMap = new Map<string, ScaleNote>();
  for (const string of pos) {
    for (const n of string) noteMap.set(`${n.si}-${n.fret}`, n);
  }

  const cellH = 34;
  const labelW = 44;

  const getN = (si: number, f: number) => noteMap.get(`${si}-${f}`);
  const isActive = (n: ScaleNote) => activeNote?.si === n.si && activeNote?.fret === n.fret;
  const isDone = (n: ScaleNote) => doneSet.has(n.deg);

  return (
    <div style={{
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(6,8,16,0.9)',
      width: '100%',
    }}>
      <div style={{ width: '100%', padding: '16px 10px', boxSizing: 'border-box' }}>

        {/* Fret numbers */}
        <div style={{ display: 'flex', paddingLeft: labelW, marginBottom: 6 }}>
          {frets.map(f => (
            <div key={f} style={{
              flex: 1, textAlign: 'center', fontSize: 10, minWidth: 0,
              color: INLAY_FRETS.has(f) || DOUBLE_FRETS.has(f) ? '#d4a574' : '#2a2a3a',
              fontWeight: 800,
            }}>
              {f === 0 ? '○' : f}
            </div>
          ))}
        </div>

        {/* Strings */}
        {Array.from({ length: 6 }, (_, si) => (
          <div key={si} style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
            {/* String label */}
            <div style={{
              width: labelW, paddingRight: 8, textAlign: 'right', flexShrink: 0,
              fontSize: 9, fontWeight: 700, color: '#555',
            }}>
              {STRING_LABELS[si]}
            </div>

            {frets.map(f => {
              const n = getN(si, f);
              const act = n && isActive(n);
              const dn = n && isDone(n);
              const oc = n ? OCTAVE_COLORS[Math.min(n.oct, 2)] : null;
              const thick = [3, 2.5, 2, 1.5, 1, 1][si];

              return (
                <div
                  key={f}
                  style={{
                    flex: 1, height: cellH, position: 'relative', minWidth: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: n && onNoteClick ? 'pointer' : 'default',
                  }}
                  onClick={() => n && onNoteClick?.(n)}
                >
                  {/* String line */}
                  <div style={{
                    position: 'absolute', top: '50%', left: 0, right: 0, height: thick,
                    background: 'linear-gradient(90deg,#1a1a28,#252535,#1a1a28)',
                    transform: 'translateY(-50%)', opacity: f === 0 ? 0 : 1,
                  }} />
                  {/* Fret line */}
                  {f > (frets[0] ?? 0) && (
                    <div style={{
                      position: 'absolute', top: 3, bottom: 3, left: 0, width: 1,
                      background: 'rgba(255,255,255,0.05)',
                    }} />
                  )}

                  {/* Note dot */}
                  {n && oc && (
                    <div
                      style={{
                        position: 'relative', zIndex: 3,
                        width: 'min(26px, 90%)', height: 26, borderRadius: '50%',
                        background: act
                          ? `linear-gradient(135deg,${oc},${oc}cc)`
                          : dn
                          ? 'rgba(255,255,255,0.03)'
                          : `${oc}12`,
                        border: `2px solid ${act ? oc : dn ? 'rgba(255,255,255,0.07)' : `${oc}44`}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: n.sol === 'Sol' ? 6 : n.sol.length > 2 ? 7 : 9,
                        fontWeight: 900,
                        color: act ? '#0d0f1a' : dn ? '#222' : oc,
                        transition: 'transform 0.1s',
                        transform: act ? 'scale(1.35)' : 'scale(1)',
                        boxShadow: act ? `0 0 16px ${oc}cc,0 0 5px ${oc}88` : 'none',
                      }}
                    >
                      {getLabel(n, labelMode)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Inlays */}
        <div style={{ display: 'flex', paddingLeft: labelW, marginTop: 4 }}>
          {frets.map(f => (
            <div key={f} style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
              {INLAY_FRETS.has(f) && (
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', margin: '0 auto' }} />
              )}
              {DOUBLE_FRETS.has(f) && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
