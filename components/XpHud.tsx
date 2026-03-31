'use client';
import { useGamification, levelFromXp, xpProgressInLevel, XP_PER_LEVEL, getLevelTitle, ACHIEVEMENTS } from '@/store/gamification';
import { useState } from 'react';

export default function XpHud() {
  const { xp, level, streak, achievements, totalNotes, totalQuizCorrect, highestBpm } = useGamification();
  const [showAchievements, setShowAchievements] = useState(false);

  const progress = xpProgressInLevel(xp);
  const progressPct = (progress / XP_PER_LEVEL) * 100;
  const title = getLevelTitle(level);

  return (
    <>
      {/* Main HUD bar */}
      <div className="card p-3 sm:p-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Level badge */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-black text-lg border-2"
              style={{
                background: 'linear-gradient(135deg, #1e3a2f, #052e16)',
                borderColor: '#4ade80',
                color: '#4ade80',
              }}
            >
              {level}
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-none">{title}</div>
              <div className="text-xs text-gray-500 mt-0.5">Level {level}</div>
            </div>
          </div>

          {/* XP bar */}
          <div className="flex-1 min-w-[120px]">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{xp} XP</span>
              <span>{progress}/{XP_PER_LEVEL}</span>
            </div>
            <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="xp-bar-fill h-full" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{streak >= 3 ? '🔥' : '📅'}</span>
            <div className="text-center">
              <div className="text-lg font-black text-orange-400 leading-none">{streak}</div>
              <div className="text-xs text-gray-600">day streak</div>
            </div>
          </div>

          {/* Achievement count */}
          <button
            onClick={() => setShowAchievements(!showAchievements)}
            className="flex items-center gap-1.5 hover:text-yellow-400 transition-colors"
          >
            <span className="text-lg">🏆</span>
            <div className="text-center">
              <div className="text-lg font-black text-yellow-400 leading-none">{achievements.length}</div>
              <div className="text-xs text-gray-600">badges</div>
            </div>
          </button>
        </div>

        {/* Quick stats */}
        <div className="flex gap-4 mt-2 pt-2 border-t border-gray-800 text-xs text-gray-600">
          <span>🎵 {totalNotes} notes</span>
          <span>✓ {totalQuizCorrect} quiz</span>
          {highestBpm > 0 && <span>🚀 {highestBpm} BPM best</span>}
        </div>
      </div>

      {/* Achievements panel */}
      {showAchievements && (
        <div className="card slide-up">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            🏆 Achievements
            <span className="text-xs text-gray-500 font-normal">
              {achievements.length}/{Object.keys(ACHIEVEMENTS).length} unlocked
            </span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(ACHIEVEMENTS).map(([id, ach]) => {
              const unlocked = achievements.includes(id);
              return (
                <div
                  key={id}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    unlocked
                      ? 'border-yellow-700 bg-yellow-950/40'
                      : 'border-gray-800 opacity-40 grayscale'
                  }`}
                >
                  <span className="text-xl">{ach.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{ach.label}</div>
                    <div className="text-xs text-gray-600">{ach.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
