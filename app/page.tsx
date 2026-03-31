'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ScaleType, SCALES, NOTES, SCALE_TYPES } from '@/lib/musicTheory';
import {
  useGamification, levelFromXp, xpProgressInLevel, XP_PER_LEVEL, getLevelTitle, ACHIEVEMENTS,
} from '@/store/gamification';

const PlayMode       = dynamic(() => import('@/components/PlayMode'),       { ssr: false });
const QuizMode       = dynamic(() => import('@/components/QuizMode'),       { ssr: false });
const SpeedChallenge = dynamic(() => import('@/components/SpeedChallenge'), { ssr: false });
const DiatonicChords = dynamic(() => import('@/components/DiatonicChords'), { ssr: false });
const ReferenceTab   = dynamic(() => import('@/components/ReferenceTab'),   { ssr: false });

type AppTab = 'play' | 'quiz' | 'speed' | 'chords' | 'ref';

const TABS: { id: AppTab; label: string; icon: string }[] = [
  { id: 'play',   label: 'Play',  icon: '▶'  },
  { id: 'quiz',   label: 'Quiz',  icon: '🧠' },
  { id: 'speed',  label: 'Speed', icon: '⚡' },
  { id: 'chords', label: 'Chords',icon: '🎵' },
  { id: 'ref',    label: 'Ref',   icon: '📋' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<AppTab>('play');
  const [rootIdx, setRootIdx]     = useState(9); // A
  const [scaleType, setScaleType] = useState<ScaleType>('pentatonic');
  const [bpm, setBpm]             = useState(65);
  const [soundOn, setSoundOn]     = useState(true);
  const [clickOn, setClickOn]     = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [xpPop, setXpPop]         = useState<number | null>(null);
  const [showAch, setShowAch]     = useState(false);

  const { xp, level, streak, achievements } = useGamification();
  const progress    = xpProgressInLevel(xp);
  const progressPct = (progress / XP_PER_LEVEL) * 100;
  const levelTitle  = getLevelTitle(level);

  const scaleDef = SCALES[scaleType];

  const onUnlock = () => setAudioUnlocked(true);

  const onRunComplete = (gained: number) => {
    setXpPop(gained);
    setTimeout(() => setXpPop(null), 2200);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(155deg,#0c0e1a 0%,#101320 60%,#080a12 100%)', fontFamily: "'Nunito','Segoe UI',sans-serif", color: '#e8eaf6', paddingBottom: 64 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@500;700;800;900&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        body{margin:0;overscroll-behavior:none}
        ::-webkit-scrollbar{height:3px;width:3px;background:#0d0f1a}
        ::-webkit-scrollbar-thumb{background:#2a2a3a;border-radius:2px}
        @keyframes popIn{0%{transform:scale(0.5);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
        @keyframes floatUp{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-80px);opacity:0}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 0 0 #c8f02530}50%{box-shadow:0 0 0 10px #c8f02500}}
        @keyframes correctFlash{0%,100%{background:rgba(200,240,37,0.1)}50%{background:rgba(200,240,37,0.3)}}
        @keyframes wrongShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
        .card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px}
        button{outline:none;-webkit-tap-highlight-color:transparent}
        input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;background:rgba(255,255,255,0.1)}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#c8f025;cursor:pointer}
        input[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#c8f025;border:none;cursor:pointer}
      `}</style>

      {/* ── XP float popup ── */}
      {xpPop !== null && (
        <div style={{
          position: 'fixed', top: 68, right: 16, zIndex: 999,
          background: 'linear-gradient(135deg,#c8f025,#25d4f0)',
          color: '#0d0f1a', fontWeight: 900, fontSize: 14,
          padding: '8px 18px', borderRadius: 20,
          animation: 'floatUp 2.2s ease forwards',
          pointerEvents: 'none',
        }}>
          +{xpPop} XP 🎉
        </div>
      )}

      {/* ── Sticky header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(12,14,26,0.97)',
        borderBottom: '1px solid rgba(200,240,37,0.1)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '0 14px', height: 54,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg,#c8f025,#25d4f0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          }}>🎸</div>
          <span style={{ fontWeight: 900, fontSize: 16, color: '#fff' }}>ScaleTrainer</span>
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Sound toggle */}
          <button
            onClick={() => setSoundOn(s => !s)}
            style={{
              background: soundOn ? 'rgba(200,240,37,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${soundOn ? '#c8f02555' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 7, padding: '4px 9px', cursor: 'pointer',
              color: soundOn ? '#c8f025' : '#555',
              fontWeight: 700, fontSize: 11, fontFamily: 'inherit',
            }}
          >{soundOn ? '🔊' : '🔇'}</button>

          {/* Click toggle */}
          <button
            onClick={() => setClickOn(c => !c)}
            style={{
              background: clickOn ? 'rgba(37,212,240,0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${clickOn ? '#25d4f055' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 7, padding: '4px 9px', cursor: 'pointer',
              color: clickOn ? '#25d4f0' : '#555',
              fontWeight: 700, fontSize: 11, fontFamily: 'inherit',
            }}
          >{clickOn ? '🥁' : '🔕'}</button>

          {/* XP pill */}
          <button onClick={() => setShowAch(a => !a)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg,#c8f025,#25d4f0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 11, color: '#0d0f1a',
            }}>{level}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 10, color: '#c8f025', fontWeight: 800 }}>{xp}xp</span>
              <div style={{ width: 44, height: 3, background: '#1e2030', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg,#c8f025,#25d4f0)', width: `${progressPct}%`, transition: 'width 0.4s' }} />
              </div>
            </div>
          </button>

          {/* Streak */}
          {streak > 0 && (
            <div style={{ fontSize: 11, color: '#ff7c2a', fontWeight: 800 }}>🔥{streak}</div>
          )}
        </div>
      </div>

      {/* ── Achievements panel (overlay) ── */}
      {showAch && (
        <div style={{
          position: 'fixed', top: 60, right: 12, zIndex: 200, width: 320,
          background: '#0e1020', border: '1px solid rgba(200,240,37,0.2)',
          borderRadius: 16, padding: 16, maxHeight: '70vh', overflowY: 'auto',
        }}>
          <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 12, color: '#fff' }}>
            🏆 Achievements
            <span style={{ fontSize: 10, color: '#555', fontWeight: 400, marginLeft: 8 }}>
              {achievements.length}/{Object.keys(ACHIEVEMENTS).length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(ACHIEVEMENTS).map(([id, ach]) => {
              const unlocked = achievements.includes(id);
              return (
                <div key={id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 10,
                  border: `1px solid ${unlocked ? 'rgba(200,240,37,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  background: unlocked ? 'rgba(200,240,37,0.04)' : 'transparent',
                  opacity: unlocked ? 1 : 0.35,
                }}>
                  <span style={{ fontSize: 18 }}>{ach.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: unlocked ? '#c8f025' : '#666' }}>{ach.label}</div>
                    <div style={{ fontSize: 10, color: '#555' }}>{ach.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setShowAch(false)}
            style={{ marginTop: 12, width: '100%', padding: '8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#666', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}
          >Close</button>
        </div>
      )}

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px 12px 0' }}>

        {/* ── Title ── */}
        <div style={{ marginBottom: 14 }}>
          <h1 style={{ margin: '0 0 2px', fontWeight: 900, fontSize: 22, color: '#fff', letterSpacing: -0.3 }}>
            {scaleDef.emoji}&nbsp;
            <span style={{ background: 'linear-gradient(90deg,#c8f025,#25d4f0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {NOTES[rootIdx]} {scaleDef.name}
            </span>
          </h1>
          <div style={{ fontSize: 11, color: '#444', fontWeight: 600 }}>
            {levelTitle} · Level {level} · {scaleDef.description}
          </div>
        </div>

        {/* ── Key selector ── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: '#444', fontWeight: 800, marginBottom: 6 }}>KEY</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {NOTES.map((n, i) => (
              <button key={i} onClick={() => setRootIdx(i)} style={{
                padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                background: rootIdx === i ? 'linear-gradient(135deg,#c8f025,#a8d010)' : 'rgba(255,255,255,0.05)',
                color: rootIdx === i ? '#0d0f1a' : '#888',
                border: rootIdx === i ? 'none' : '1px solid rgba(255,255,255,0.07)',
                fontWeight: rootIdx === i ? 900 : 600,
                fontSize: 13, fontFamily: 'inherit', transition: 'all 0.15s',
                boxShadow: rootIdx === i ? '0 3px 12px rgba(200,240,37,0.25)' : 'none',
                minWidth: 36, textAlign: 'center',
              }}>{n}</button>
            ))}
          </div>
        </div>

        {/* ── Scale selector ── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: '#444', fontWeight: 800, marginBottom: 6 }}>SCALE</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {SCALE_TYPES.map(k => (
              <button key={k} onClick={() => setScaleType(k)} style={{
                padding: '6px 11px', borderRadius: 8, cursor: 'pointer',
                background: scaleType === k ? 'rgba(37,212,240,0.14)' : 'rgba(255,255,255,0.04)',
                color: scaleType === k ? '#25d4f0' : '#666',
                border: `1px solid ${scaleType === k ? '#25d4f055' : 'rgba(255,255,255,0.07)'}`,
                fontWeight: 700, fontSize: 12, fontFamily: 'inherit', transition: 'all 0.15s',
              }}>{SCALES[k].emoji} {SCALES[k].name}</button>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3 }}>
          {TABS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === id ? 'rgba(200,240,37,0.1)' : 'transparent',
              color: activeTab === id ? '#c8f025' : '#555',
              fontWeight: 700, fontSize: 11, fontFamily: 'inherit', transition: 'all 0.18s',
              borderBottom: activeTab === id ? '2px solid #c8f025' : '2px solid transparent',
              whiteSpace: 'nowrap',
            }}>{icon} {label}</button>
          ))}
        </div>

        {/* ── Tab content ── */}
        {activeTab === 'play' && (
          <PlayMode
            rootIdx={rootIdx}
            scaleType={scaleType}
            scaleDef={scaleDef}
            bpm={bpm}
            onBpmChange={setBpm}
            soundOn={soundOn}
            clickOn={clickOn}
            audioUnlocked={audioUnlocked}
            onUnlock={onUnlock}
            onRunComplete={onRunComplete}
          />
        )}
        {activeTab === 'quiz' && (
          <QuizMode
            rootIdx={rootIdx}
            scaleType={scaleType}
            scaleDef={scaleDef}
            audioUnlocked={audioUnlocked}
            onUnlock={onUnlock}
          />
        )}
        {activeTab === 'speed' && (
          <SpeedChallenge
            rootIdx={rootIdx}
            scaleType={scaleType}
            scaleDef={scaleDef}
            soundOn={soundOn}
            clickOn={clickOn}
            audioUnlocked={audioUnlocked}
            onUnlock={onUnlock}
          />
        )}
        {activeTab === 'chords' && (
          <DiatonicChords
            rootIdx={rootIdx}
            scaleType={scaleType}
            scaleDef={scaleDef}
            onUnlock={onUnlock}
          />
        )}
        {activeTab === 'ref' && (
          <ReferenceTab
            rootIdx={rootIdx}
            scaleType={scaleType}
            scaleDef={scaleDef}
            onUnlock={onUnlock}
          />
        )}
      </div>

      {/* ── Bottom nav ── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(12,14,26,0.97)', borderTop: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
      }}>
        {TABS.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            flex: 1, padding: '10px 0', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer',
            color: activeTab === id ? '#c8f025' : '#555',
            fontWeight: activeTab === id ? 800 : 600,
            fontFamily: 'inherit', fontSize: 10, transition: 'color 0.15s',
            borderTop: activeTab === id ? '2px solid #c8f025' : '2px solid transparent',
          }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
