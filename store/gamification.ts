// Gamification store using localStorage + React state
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  lastPracticeDate: string | null;
  totalNotes: number;
  totalQuizCorrect: number;
  totalQuizWrong: number;
  achievements: string[];
  highestBpm: number;

  addXp: (amount: number) => void;
  recordPractice: () => void;
  recordNote: () => void;
  recordQuizAnswer: (correct: boolean) => void;
  recordBpm: (bpm: number) => void;
  unlockAchievement: (id: string) => void;
  reset: () => void;
}

export const XP_PER_LEVEL = 200;

export function xpForLevel(level: number): number {
  return level * XP_PER_LEVEL;
}

export function levelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpProgressInLevel(xp: number): number {
  return xp % XP_PER_LEVEL;
}

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Open Stringer',
  2: 'Fret Crawler',
  3: 'Chord Seeker',
  4: 'Scale Runner',
  5: 'Pentatonic Pro',
  6: 'Blues Bender',
  7: 'Mode Explorer',
  8: 'Jazz Cat',
  9: 'Fretboard Wizard',
  10: 'Guitar Sage',
};

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, 10)] ?? 'Guitar Legend';
}

export const ACHIEVEMENTS: Record<string, { label: string; icon: string; desc: string }> = {
  first_note: { label: 'First Note', icon: '🎸', desc: 'Play your first note' },
  streak_3: { label: 'On Fire', icon: '🔥', desc: '3-day streak' },
  streak_7: { label: 'Week Warrior', icon: '⚡', desc: '7-day streak' },
  quiz_10: { label: 'Quick Ears', icon: '👂', desc: 'Answer 10 quiz questions correctly' },
  quiz_50: { label: 'Solfege Master', icon: '🎵', desc: 'Answer 50 quiz questions correctly' },
  bpm_120: { label: 'Speed Demon', icon: '🚀', desc: 'Reach 120 BPM in speed challenge' },
  bpm_160: { label: 'Lightning Fingers', icon: '⚡', desc: 'Reach 160 BPM' },
  level_5: { label: 'Halfway There', icon: '🌟', desc: 'Reach level 5' },
  level_10: { label: 'Guitar Sage', icon: '🏆', desc: 'Reach level 10' },
  notes_100: { label: 'Century Club', icon: '💯', desc: 'Play 100 notes' },
};

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export const useGamification = create<GamificationState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      streak: 0,
      lastPracticeDate: null,
      totalNotes: 0,
      totalQuizCorrect: 0,
      totalQuizWrong: 0,
      achievements: [],
      highestBpm: 0,

      addXp: (amount) => {
        const newXp = get().xp + amount;
        const newLevel = levelFromXp(newXp);
        set({ xp: newXp, level: newLevel });
        if (newLevel >= 5) get().unlockAchievement('level_5');
        if (newLevel >= 10) get().unlockAchievement('level_10');
      },

      recordPractice: () => {
        const today = todayStr();
        const last = get().lastPracticeDate;
        if (last === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const newStreak = last === yesterdayStr ? get().streak + 1 : 1;
        set({ streak: newStreak, lastPracticeDate: today });
        get().addXp(10); // daily bonus

        if (newStreak >= 3) get().unlockAchievement('streak_3');
        if (newStreak >= 7) get().unlockAchievement('streak_7');
      },

      recordNote: () => {
        const total = get().totalNotes + 1;
        set({ totalNotes: total });
        if (total === 1) get().unlockAchievement('first_note');
        if (total === 100) get().unlockAchievement('notes_100');
        get().addXp(1);
        get().recordPractice();
      },

      recordQuizAnswer: (correct) => {
        if (correct) {
          const total = get().totalQuizCorrect + 1;
          set({ totalQuizCorrect: total });
          get().addXp(5);
          if (total >= 10) get().unlockAchievement('quiz_10');
          if (total >= 50) get().unlockAchievement('quiz_50');
        } else {
          set({ totalQuizWrong: get().totalQuizWrong + 1 });
        }
      },

      recordBpm: (bpm) => {
        if (bpm > get().highestBpm) {
          set({ highestBpm: bpm });
          if (bpm >= 120) get().unlockAchievement('bpm_120');
          if (bpm >= 160) get().unlockAchievement('bpm_160');
        }
        get().addXp(Math.floor(bpm / 20));
      },

      unlockAchievement: (id) => {
        const existing = get().achievements;
        if (!existing.includes(id)) {
          set({ achievements: [...existing, id] });
        }
      },

      reset: () => set({
        xp: 0, level: 1, streak: 0, lastPracticeDate: null,
        totalNotes: 0, totalQuizCorrect: 0, totalQuizWrong: 0,
        achievements: [], highestBpm: 0,
      }),
    }),
    { name: 'guitar-trainer-gamification' }
  )
);
