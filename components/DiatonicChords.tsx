'use client';
import { getDiatonicChords, ScaleType, ScaleDef, NOTES } from '@/lib/musicTheory';
import { playChordRaw, getCtx } from '@/hooks/useAudio';

interface DiatonicChordsProps {
  rootIdx: number;
  scaleType: ScaleType;
  scaleDef: ScaleDef;
  onUnlock: () => void;
}

export default function DiatonicChords({ rootIdx, scaleType, scaleDef, onUnlock }: DiatonicChordsProps) {
  const chords = getDiatonicChords(rootIdx, scaleType);

  const playChordBtn = (interval: number) => {
    try { getCtx(); onUnlock(); } catch (e) {}
    // Build triad: root + major/minor third + fifth
    playChordRaw(rootIdx, [interval, interval + 4, interval + 7]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      <div className="card">
        <div style={{ fontSize: 10, fontWeight: 800, color: '#555', letterSpacing: 1.5, marginBottom: 12 }}>
          CHORDS IN {NOTES[rootIdx]} {scaleDef.name.toUpperCase()}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(85px,1fr))', gap: 8 }}>
          {chords.map((chord) => (
            <button
              key={chord.roman}
              onClick={() => playChordBtn(chord.interval)}
              style={{
                background: `${chord.color}08`,
                border: `1px solid ${chord.color}22`,
                borderRadius: 10, padding: '12px 6px', textAlign: 'center',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = `${chord.color}18`;
                (e.currentTarget as HTMLButtonElement).style.border = `1px solid ${chord.color}55`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = `${chord.color}08`;
                (e.currentTarget as HTMLButtonElement).style.border = `1px solid ${chord.color}22`;
              }}
            >
              <div style={{ fontSize: 10, color: '#444', fontWeight: 700 }}>{chord.roman}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: chord.color, lineHeight: 1.2 }}>{chord.root}</div>
              <div style={{ fontSize: 10, color: '#666', fontWeight: 700 }}>{chord.type}</div>
              <div style={{ fontSize: 8, color: '#333', marginTop: 2 }}>tap ▶</div>
            </button>
          ))}
        </div>
      </div>

      {/* Theory note */}
      <div style={{
        fontSize: 11, color: '#555', lineHeight: 1.8,
        padding: '10px 14px', background: 'rgba(255,255,255,0.02)',
        borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{ color: '#c8f025', fontWeight: 700 }}>I · IV · V</span> = the power trio of any key — most songs live here.&nbsp;
        <span style={{ color: '#25d4f0', fontWeight: 700 }}>II · III · VI</span> = minor colour chords.&nbsp;
        <span style={{ color: '#f025c8', fontWeight: 700 }}>VII</span> = tense diminished, resolves to I.
      </div>
    </div>
  );
}
