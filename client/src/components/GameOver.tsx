interface GameOverProps {
  isOpen: boolean;
  result: string;
  userWon: boolean | null;
  eloChange: number;
  onRematch: () => void;
  onReturnHome: () => void;
}

export default function GameOver({
  isOpen,
  result,
  userWon,
  eloChange,
  onRematch,
  onReturnHome,
}: GameOverProps) {
  if (!isOpen) return null;

  let title = 'Game Drawn!';
  let icon = '🤝';
  let badgeClass = 'badge-muted';

  if (userWon === true) {
    title = 'Victory!';
    icon = '🏆';
    badgeClass = 'badge-success';
  } else if (userWon === false) {
    title = 'Defeat';
    icon = '💀';
    badgeClass = 'badge-danger';
  }

  const resultDescription = {
    white_wins: 'White won by checkmate or resignation',
    black_wins: 'Black won by checkmate or resignation',
    draw: 'Game ended in a draw',
  }[result] || result;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{icon}</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, color: userWon === true ? 'var(--accent)' : 'var(--text-primary)' }}>
          {title}
        </h2>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
          {resultDescription}
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          padding: '16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Rating Change:</span>
          <span className={`badge ${badgeClass}`} style={{ fontSize: 16, padding: '4px 12px' }}>
            {eloChange > 0 ? `+${eloChange}` : eloChange} ELO
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onRematch} style={{ flex: 1 }}>
            Play Again
          </button>
          <button className="btn btn-secondary" onClick={onReturnHome} style={{ flex: 1 }}>
            Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
