'use client';
import { useState } from 'react';
import {
  ScaleType, ScaleDef, SCALES, SCALE_TYPES, NOTES, SOLFEGE,
  buildScale, OCTAVE_COLORS, STRING_LABELS, getLabel,
} from '@/lib/musicTheory';
import { playNoteRaw, getCtx } from '@/hooks/useAudio';

interface ReferenceTabProps {
  rootIdx: number;
  scaleType: ScaleType;
  scaleDef: ScaleDef;
  onUnlock: () => void;
}

const INTERVALS = [
  { s: 0,  abbr: 'P1',  name: 'Unison'       },
  { s: 1,  abbr: 'm2',  name: 'Minor 2nd'     },
  { s: 2,  abbr: 'M2',  name: 'Major 2nd'     },
  { s: 3,  abbr: 'm3',  name: 'Minor 3rd'     },
  { s: 4,  abbr: 'M3',  name: 'Major 3rd'     },
  { s: 5,  abbr: 'P4',  name: 'Perfect 4th'   },
  { s: 6,  abbr: 'TT',  name: 'Tritone'       },
  { s: 7,  abbr: 'P5',  name: 'Perfect 5th'   },
  { s: 8,  abbr: 'm6',  name: 'Minor 6th'     },
  { s: 9,  abbr: 'M6',  name: 'Major 6th'     },
  { s: 10, abbr: 'm7',  name: 'Minor 7th'     },
  { s: 11, abbr: 'M7',  name: 'Major 7th'     },
  { s: 12, abbr: 'P8',  name: 'Octave'        },
];

type RefSection = 'scale' | 'strings' | 'intervals' | 'tips';

const TIPS = [
  { icon: '🎯', title: 'Root Note First',   body: 'Find the root on the low E and A strings first — these are your anchors when soloing.' },
  { icon: '👂', title: 'Sing + Play',       body: 'Solfege maps melody to emotion. Sing "Do Re Mi" as you play to lock in the sound.' },
  { icon: '🔄', title: 'Both Directions',   body: 'Always practice ascending AND descending. Music rarely moves in one direction.' },
  { icon: '📍', title: 'CAGED System',      body: 'Every scale pattern connects to a chord shape. C-A-G-E-D shapes cover the full neck.' },
  { icon: '⏱', title: 'Metronome Always',  body: 'Slow + accurate beats fast + sloppy. Start at 60 BPM, only increase when clean.' },
  { icon: '🎵', title: 'Dorian for Funk',   body: "Dorian is natural minor with a raised 6th. Santana's Oye Como Va is pure Dorian." },
  { icon: '🔵', title: 'The Blue Note',     body: 'Blues scale adds the #4/b5 between P4 and P5. This "blue note" creates tension.' },
  { icon: '⭐', title: 'Pentatonic Box',    body: 'The A minor pentatonic "box" (frets 5-8) is the most-used rock/blues pattern ever.' },
];

export default function ReferenceTab({ rootIdx, scaleType, scaleDef, onUnlock }: ReferenceTabProps) {
  const [section, setSection] = useState<RefSection>('scale');
  const pos = buildScale(rootIdx, scaleType);
  const flat = pos.flat();
  const ivs = SCALES[scaleType].intervals;

  const hear = (midi: number) => {
    try { getCtx(); onUnlock(); } catch (e) {}
    playNoteRaw(midi, 0.7);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {([
          ['scale',     '🎼 Scale'],
          ['strings',   '🎸 By String'],
          ['intervals', '📏 Intervals'],
          ['tips',      '💡 Tips'],
        ] as [RefSection, string][]).map(([id, lbl]) => (
          <button key={id} onClick={() => setSection(id)} style={{
            padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
            background: section === id ? 'rgba(200,240,37,0.1)' : 'rgba(255,255,255,0.04)',
            color: section === id ? '#c8f025' : '#555',
            border: `1px solid ${section === id ? '#c8f02555' : 'rgba(255,255,255,0.07)'}`,
            fontWeight: 700, fontSize: 12, fontFamily: 'inherit', transition: 'all 0.18s',
          }}>{lbl}</button>
        ))}
      </div>

      {/* ── Scale notes ── */}
      {section === 'scale' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div style={{ fontSize: 10, fontWeight: 800, color: '#555', letterSpacing: 1.5, marginBottom: 12 }}>
              {NOTES[rootIdx]} {scaleDef.name.toUpperCase()} — TAP TO HEAR
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ivs.map((iv, i) => {
                const noteName = NOTES[(rootIdx + iv) % 12];
                const sol = SOLFEGE[i] ?? String(i + 1);
                const midi = 60 + iv;
                return (
                  <button
                    key={i}
                    onClick={() => hear(midi)}
                    style={{
                      flex: '1 1 60px',
                      background: 'rgba(200,240,37,0.05)', border: '1px solid rgba(200,240,37,0.12)',
                      borderRadius: 10, padding: '10px 4px', textAlign: 'center',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: 17, fontWeight: 900, color: '#c8f025' }}>{noteName}</div>
                    <div style={{ fontSize: 10, color: '#777', fontWeight: 700 }}>{sol}</div>
                    <div style={{ fontSize: 8, color: '#444' }}>deg {i + 1}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scale comparison table */}
          <div className="card">
            <div style={{ fontSize: 10, fontWeight: 800, color: '#555', letterSpacing: 1.5, marginBottom: 12 }}>
              ALL SCALES IN {NOTES[rootIdx]}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <tbody>
                  {SCALE_TYPES.map(type => {
                    const def = SCALES[type];
                    return (
                      <tr key={type} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px 10px 8px 0', color: '#666', fontWeight: 700, whiteSpace: 'nowrap', fontSize: 11 }}>
                          {def.emoji} {def.name}
                        </td>
                        <td style={{ padding: '8px 0' }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {def.intervals.map((iv, i) => (
                              <span key={i} style={{
                                fontSize: 11, padding: '2px 6px', borderRadius: 5, fontWeight: 700,
                                background: i === 0 ? 'rgba(200,240,37,0.12)' : 'rgba(255,255,255,0.04)',
                                color: i === 0 ? '#c8f025' : '#888',
                              }}>
                                {NOTES[(rootIdx + iv) % 12]}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── String by string ── */}
      {section === 'strings' && (
        <div className="card">
          <div style={{ fontSize: 10, fontWeight: 800, color: '#555', letterSpacing: 1.5, marginBottom: 12 }}>
            STRING BY STRING — TAP TO HEAR
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pos.map((sn, si) => sn.length > 0 && (
              <div key={si} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.02)', borderRadius: 9, padding: '8px 12px',
              }}>
                <div style={{ width: 44, fontSize: 9, fontWeight: 800, color: '#444', flexShrink: 0 }}>
                  {STRING_LABELS[si]}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {sn.map((n, i) => {
                    const oc = OCTAVE_COLORS[Math.min(n.oct, 2)];
                    return (
                      <button
                        key={i}
                        onClick={() => hear(n.midi)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          padding: 2, fontFamily: 'inherit',
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: `${oc}12`, border: `2px solid ${oc}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: n.sol === 'Sol' ? 6 : 8, fontWeight: 900, color: oc,
                        }}>
                          {n.sol}
                        </div>
                        <div style={{ fontSize: 8, color: '#666', fontWeight: 700 }}>{NOTES[n.note]}</div>
                        <div style={{ fontSize: 7, color: '#333' }}>f{n.fret}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Intervals ── */}
      {section === 'intervals' && (
        <div className="card">
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Semi', 'Abbr', 'Name'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INTERVALS.map(iv => (
                <tr key={iv.s} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '7px 8px', fontFamily: 'monospace', color: '#c8f025', fontWeight: 700 }}>{iv.s}</td>
                  <td style={{ padding: '7px 8px' }}>
                    <span style={{ background: 'rgba(255,212,0,0.08)', color: '#fbbf24', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{iv.abbr}</span>
                  </td>
                  <td style={{ padding: '7px 8px', color: '#888' }}>{iv.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tips ── */}
      {section === 'tips' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 10 }}>
          {TIPS.map(tip => (
            <div key={tip.title} className="card" style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{tip.icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>{tip.title}</div>
                <div style={{ fontSize: 11, color: '#666', lineHeight: 1.6 }}>{tip.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
