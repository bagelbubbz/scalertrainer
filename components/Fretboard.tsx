'use client';
import React from 'react';
import {
  ScaleNote, STRING_LABELS, OCTAVE_COLORS, LabelMode, getLabel,
} from '@/lib/musicTheory';

interface FretboardProps {
  pos: ScaleNote[][];
  frets: number[];
  activeNote?: ScaleNote | null;
  doneSet?: Set<number>;
  onNoteClick?: (n: ScaleNote) => void;
  labelMode?: LabelMode;
}

const INLAY_FRETS = new Set([3, 5, 7, 9, 15]);
const DOUBLE_FRETS = new Set([12]);

export default function Fretboard({
  pos, frets, activeNote, doneSet = new Set(), onNoteClick, labelMode = 'solfege',
}: FretboardProps) {
  const noteMap = new Map<string, ScaleNote>();
  for (const string of pos)
    for (const n of string) noteMap.set(`${n.si}-${n.fret}`, n);

  // Layout constants (logical SVG units — scale to any screen via viewBox)
  const cellW  = 58;   // width per fret column
  const cellH  = 46;   // height per string row
  const labelW = 52;   // left label area
  const topPad = 28;   // space for fret numbers
  const botPad = 20;   // space for inlay dots
  const dotR   = 14;   // note dot radius
  const numStrings = 6;

  const svgW = labelW + frets.length * cellW;
  const svgH = topPad + numStrings * cellH + botPad;

  const cx  = (fi: number) => labelW + fi * cellW + cellW / 2;
  const sy  = (si: number) => topPad + si * cellH + cellH / 2;
  const getN = (si: number, f: number) => noteMap.get(`${si}-${f}`);
  const isActive = (n: ScaleNote) => activeNote?.si === n.si && activeNote?.fret === n.fret;
  const isDone   = (n: ScaleNote) => doneSet.has(n.deg);

  return (
    <div style={{
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(6,8,16,0.9)',
      width: '100%',
      overflow: 'hidden',
    }}>
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        width="100%"
        style={{ display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="stringGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#111120" />
            <stop offset="50%"  stopColor="#28283a" />
            <stop offset="100%" stopColor="#111120" />
          </linearGradient>
        </defs>

        {/* ── Fret number labels ─────────────────────────────── */}
        {frets.map((f, fi) => {
          const isMarked = INLAY_FRETS.has(f) || DOUBLE_FRETS.has(f);
          return (
            <text key={f} x={cx(fi)} y={topPad - 9}
              textAnchor="middle" fontSize={11} fontWeight={800}
              fill={isMarked ? '#d4a574' : '#666'}>
              {f === 0 ? '○' : f}
            </text>
          );
        })}

        {/* ── Full-height fret lines ─────────────────────────── */}
        {frets.map((f, fi) => {
          if (fi === 0) return null;
          return (
            <line key={`fretline-${f}`}
              x1={cx(fi) - cellW / 2} y1={topPad}
              x2={cx(fi) - cellW / 2} y2={topPad + numStrings * cellH}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1.5}
            />
          );
        })}

        {/* ── Nut at fret 0 ─────────────────────────────────── */}
        {frets[0] === 0 && (
          <rect
            x={labelW} y={topPad}
            width={5} height={numStrings * cellH}
            fill="rgba(255,255,255,0.18)" rx={2}
          />
        )}

        {/* ── Strings + notes ───────────────────────────────── */}
        {Array.from({ length: numStrings }, (_, si) => {
          const y = sy(si);
          const thick = [3, 2.5, 2, 1.5, 1, 0.8][si];
          return (
            <g key={si}>
              {/* String label */}
              <text x={labelW - 10} y={y + 4}
                textAnchor="end" fontSize={10} fontWeight={700} fill="#444">
                {STRING_LABELS[si]}
              </text>

              {/* String line */}
              <line
                x1={labelW} y1={y}
                x2={labelW + frets.length * cellW} y2={y}
                stroke="url(#stringGrad)" strokeWidth={thick}
              />

              {/* Notes */}
              {frets.map((f, fi) => {
                const n = getN(si, f);
                if (!n) return null;
                const act = isActive(n);
                const dn  = isDone(n);
                const oc  = OCTAVE_COLORS[Math.min(n.oct, 2)];
                const lbl = getLabel(n, labelMode);
                const fs  = lbl === 'Sol' ? 7 : lbl.length > 2 ? 8 : 10;
                const x   = cx(fi);
                return (
                  <g key={`${si}-${f}`}
                    style={{ cursor: onNoteClick ? 'pointer' : 'default' }}
                    onClick={() => onNoteClick?.(n)}>
                    {/* Glow ring when active */}
                    {act && (
                      <circle cx={x} cy={y} r={dotR + 5}
                        fill={`${oc}28`} stroke={`${oc}55`} strokeWidth={1} />
                    )}
                    {/* Dot */}
                    <circle cx={x} cy={y} r={dotR}
                      fill={act ? oc : dn ? 'rgba(255,255,255,0.03)' : `${oc}16`}
                      stroke={act ? oc : dn ? 'rgba(255,255,255,0.08)' : `${oc}55`}
                      strokeWidth={act ? 2.5 : 1.5}
                    />
                    {/* Label */}
                    <text cx={x} cy={y}
                      x={x} y={y + fs * 0.38}
                      textAnchor="middle" fontSize={fs} fontWeight={900}
                      fill={act ? '#0d0f1a' : dn ? '#222' : oc}
                      style={{ fontFamily: 'inherit', userSelect: 'none' }}>
                      {lbl}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* ── Inlay dots ────────────────────────────────────── */}
        {frets.map((f, fi) => {
          const x = cx(fi);
          const y = topPad + numStrings * cellH + 11;
          if (DOUBLE_FRETS.has(f)) return (
            <g key={`inlay-${f}`}>
              <circle cx={x - 6} cy={y} r={3} fill="rgba(255,255,255,0.13)" />
              <circle cx={x + 6} cy={y} r={3} fill="rgba(255,255,255,0.13)" />
            </g>
          );
          if (INLAY_FRETS.has(f)) return (
            <circle key={`inlay-${f}`} cx={x} cy={y} r={3} fill="rgba(255,255,255,0.1)" />
          );
          return null;
        })}
      </svg>
    </div>
  );
}
