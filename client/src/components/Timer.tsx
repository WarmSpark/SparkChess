import { useEffect, useRef } from 'react';

interface TimerProps {
  whiteTime: number;
  blackTime: number;
  activeTurn: 'w' | 'b';
  onTimeUp: (color: 'w' | 'b') => void;
  running: boolean;
}

const formatTime = (ms: number) => {
  const total = Math.max(0, ms);
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function Timer({ whiteTime, blackTime, activeTurn, onTimeUp, running }: TimerProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const whiteRef = useRef(whiteTime);
  const blackRef = useRef(blackTime);
  const activeTurnRef = useRef(activeTurn);
  const whiteDisplayRef = useRef<HTMLDivElement>(null);
  const blackDisplayRef = useRef<HTMLDivElement>(null);

  useEffect(() => { whiteRef.current = whiteTime; }, [whiteTime]);
  useEffect(() => { blackRef.current = blackTime; }, [blackTime]);
  useEffect(() => { activeTurnRef.current = activeTurn; }, [activeTurn]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      if (activeTurnRef.current === 'w') {
        whiteRef.current = Math.max(0, whiteRef.current - 100);
        if (whiteDisplayRef.current) {
          whiteDisplayRef.current.textContent = formatTime(whiteRef.current);
          whiteDisplayRef.current.style.color = whiteRef.current < 30000 ? 'var(--danger)' : 'var(--text-primary)';
        }
        if (whiteRef.current <= 0) onTimeUp('w');
      } else {
        blackRef.current = Math.max(0, blackRef.current - 100);
        if (blackDisplayRef.current) {
          blackDisplayRef.current.textContent = formatTime(blackRef.current);
          blackDisplayRef.current.style.color = blackRef.current < 30000 ? 'var(--danger)' : 'var(--text-primary)';
        }
        if (blackRef.current <= 0) onTimeUp('b');
      }
    }, 100);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, onTimeUp]);

  const clockStyle = (isActive: boolean) => ({
    padding: '10px 20px',
    borderRadius: 'var(--radius-sm)',
    background: isActive ? 'var(--accent)' : 'var(--bg-secondary)',
    border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
    textAlign: 'center' as const,
    minWidth: 100,
  });

  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
      <div style={clockStyle(activeTurn === 'w')}>
        <div style={{ fontSize: 11, fontWeight: 700, color: activeTurn === 'w' ? '#1a1200' : 'var(--text-muted)', marginBottom: 2 }}>WHITE</div>
        <div
          ref={whiteDisplayRef}
          style={{
            fontSize: 22,
            fontWeight: 800,
            fontFamily: 'monospace',
            color: activeTurn === 'w' ? '#1a1200' : 'var(--text-primary)',
          }}
        >
          {formatTime(whiteTime)}
        </div>
      </div>
      <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>⏱</div>
      <div style={clockStyle(activeTurn === 'b')}>
        <div style={{ fontSize: 11, fontWeight: 700, color: activeTurn === 'b' ? '#1a1200' : 'var(--text-muted)', marginBottom: 2 }}>BLACK</div>
        <div
          ref={blackDisplayRef}
          style={{
            fontSize: 22,
            fontWeight: 800,
            fontFamily: 'monospace',
            color: activeTurn === 'b' ? '#1a1200' : 'var(--text-primary)',
          }}
        >
          {formatTime(blackTime)}
        </div>
      </div>
    </div>
  );
}
