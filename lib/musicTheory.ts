// ─── Note Names ────────────────────────────────────────────────────────────────
export const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] as const;
export type NoteName = typeof NOTES[number];

// ─── Octave Colors (lime → cyan → pink, matches original) ──────────────────────
export const OCTAVE_COLORS = ['#c8f025', '#25d4f0', '#f025c8'] as const;

// ─── Solfege ────────────────────────────────────────────────────────────────────
export const SOLFEGE = ['Do','Re','Mi','Fa','Sol','La','Ti'] as const;
export type SolfegeNote = typeof SOLFEGE[number];

// ─── Scale Definitions ──────────────────────────────────────────────────────────
export type ScaleType = 'major' | 'minor' | 'pentatonic' | 'blues' | 'dorian';

export interface ScaleDef {
  name: string;
  intervals: number[];
  emoji: string;
  description: string;
}

export const SCALES: Record<ScaleType, ScaleDef> = {
  major: {
    name: 'Major',
    intervals: [0,2,4,5,7,9,11],
    emoji: '🌟',
    description: 'Happy, bright, foundational Western scale',
  },
  minor: {
    name: 'Nat. Minor',
    intervals: [0,2,3,5,7,8,10],
    emoji: '🌙',
    description: 'Dark, emotional, melancholic feel',
  },
  pentatonic: {
    name: 'Pentatonic',
    intervals: [0,2,4,7,9],
    emoji: '⭐',
    description: 'Minor pentatonic — rock & blues workhorse',
  },
  blues: {
    name: 'Blues',
    intervals: [0,3,5,6,7,10],
    emoji: '🎵',
    description: 'Minor pentatonic + blue note (#4)',
  },
  dorian: {
    name: 'Dorian',
    intervals: [0,2,3,5,7,9,10],
    emoji: '🔮',
    description: 'Minor with raised 6th — jazzy & funky',
  },
};

export const SCALE_TYPES = Object.keys(SCALES) as ScaleType[];

// ─── Guitar Strings ─────────────────────────────────────────────────────────────
export const OPEN_STRINGS = [4, 9, 2, 7, 11, 4]; // semitone from C: E A D G B e
export const OPEN_MIDI    = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 e4
export const STRING_NAMES  = ['E', 'A', 'D', 'G', 'B', 'e'];
export const STRING_LABELS = ['Low E', 'A', 'D', 'G', 'B', 'High e'];

// ─── Build Scale Positions (guitar-practical, 3 notes per string) ──────────────
export interface ScaleNote {
  note: number;   // semitone 0–11
  deg: number;    // absolute step index in the run
  sd: number;     // scale degree index (0 = root)
  oct: number;    // octave 0/1/2
  sol: string;    // solfege syllable
  fret: number;
  si: number;     // string index 0–5
  midi: number;
}

function semitone(si: number, f: number): number {
  return (OPEN_STRINGS[si] + f) % 12;
}

function findFret(si: number, target: number, minF: number): number | null {
  for (let f = minF; f <= minF + 13; f++) {
    if (semitone(si, f) === target) return f;
  }
  return null;
}

export function buildScale(rootIdx: number, scaleType: ScaleType): ScaleNote[][] {
  const ivs = SCALES[scaleType].intervals;
  const solfege = SOLFEGE;

  // Build full sequence: 3 octaves of the scale
  const seq: { note: number; deg: number; sd: number; oct: number; sol: string }[] = [];
  for (let i = 0; i < ivs.length * 3; i++) {
    const d = i % ivs.length;
    const o = Math.floor(i / ivs.length);
    seq.push({
      note: (rootIdx + o * 12 + ivs[d]) % 12,
      deg: i,
      sd: d,
      oct: o,
      sol: solfege[d] ?? String(d + 1),
    });
  }

  // Assign to strings: 3 notes per string, keep ascending frets
  const pos: ScaleNote[][] = Array.from({ length: 6 }, () => []);
  let ni = 0;
  for (let s = 0; s < 6 && ni < seq.length; s++) {
    for (let n = 0; n < 3 && ni < seq.length; n++) {
      const t = seq[ni];
      const prevF = pos[s].at(-1)?.fret ?? null;
      const prevS = s > 0 ? (pos[s - 1][0]?.fret ?? 0) : 0;
      const minF = Math.max(0, prevF !== null ? prevF + 1 : prevS - 4);
      const fret = findFret(s, t.note, minF);
      if (fret !== null && fret <= 19) {
        pos[s].push({
          ...t,
          fret,
          si: s,
          midi: OPEN_MIDI[s] + fret,
        });
        ni++;
      } else {
        break;
      }
    }
  }
  return pos;
}

// ─── Flat sequence helpers ──────────────────────────────────────────────────────
export type PlayDirection = 'up' | 'down' | 'updown';

export function buildSequence(pos: ScaleNote[][], dir: PlayDirection): ScaleNote[] {
  const flat = pos.flat();
  if (dir === 'down') return [...flat].reverse();
  if (dir === 'updown') return [...flat, ...[...flat].reverse().slice(1)];
  return flat;
}

// ─── Label helper ───────────────────────────────────────────────────────────────
export type LabelMode = 'solfege' | 'note' | 'degree';

export function getLabel(n: ScaleNote, mode: LabelMode): string {
  if (mode === 'solfege') return n.sol;
  if (mode === 'note')    return NOTES[n.note];
  return String(n.sd + 1);
}

// ─── Diatonic Chord Generation ─────────────────────────────────────────────────
export const CHORD_ROMAN   = ['I','II','III','IV','V','VI','VII'];
export const CHORD_TYPES_MAJ = ['maj','min','min','maj','maj','min','dim'];
export const CHORD_TYPES_MIN = ['min','dim','maj','min','min','maj','maj'];

export interface DiatonicChord {
  roman: string;
  root: string;
  type: string;
  interval: number; // semitones from key root
  color: string;
}

export function getDiatonicChords(rootIdx: number, scaleType: ScaleType): DiatonicChord[] {
  const ivs = SCALES[scaleType].intervals;
  const types = scaleType === 'minor' ? CHORD_TYPES_MIN : CHORD_TYPES_MAJ;
  return ivs.slice(0, 7).map((iv, i) => ({
    roman: CHORD_ROMAN[i],
    root: NOTES[(rootIdx + iv) % 12],
    type: types[i] ?? 'maj',
    interval: iv,
    color: types[i] === 'maj' ? '#c8f025' : types[i] === 'min' ? '#25d4f0' : '#f025c8',
  }));
}

// ─── Fret range helper ─────────────────────────────────────────────────────────
export function getFretRange(pos: ScaleNote[][]): { min: number; max: number; frets: number[] } {
  const allFrets = pos.flat().map(p => p.fret);
  if (!allFrets.length) return { min: 0, max: 12, frets: Array.from({ length: 13 }, (_, i) => i) };
  const min = Math.max(0, Math.min(...allFrets) - 1);
  const max = Math.max(...allFrets) + 1;
  return { min, max, frets: Array.from({ length: max - min + 1 }, (_, i) => min + i) };
}
