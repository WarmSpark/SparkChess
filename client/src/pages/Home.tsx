import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket, initSocket } from '../hooks/useSocket';
import type { ActiveGame } from '../types';

export default function Home() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [timeControl, setTimeControl] = useState(10);
  const [joinId, setJoinId] = useState('');
  const [creatingGame, setCreatingGame] = useState(false);
  const [joiningGame, setJoiningGame] = useState(false);
  const [createdGameId, setCreatedGameId] = useState<string | null>(null);

  const socket = useSocket();

  useEffect(() => {
    if (!token) return;
    const s = initSocket(token);

    s.emit('get_active_games');

    s.on('active_games', (games: ActiveGame[]) => setActiveGames(games));
    s.on('active_games_update', (games: ActiveGame[]) => setActiveGames(games));

    s.on('game_created', ({ gameId }: { gameId: string }) => {
      setCreatingGame(false);
      setCreatedGameId(gameId);
    });

    s.on('game_started', ({ gameId }: { gameId: string }) => {
      navigate(`/game/${gameId}`);
    });

    return () => {
      s.off('active_games');
      s.off('active_games_update');
      s.off('game_created');
      s.off('game_started');
    };
  }, [token, navigate]);

  const createGame = () => {
    setCreatingGame(true);
    setCreatedGameId(null);
    socket?.emit('create_game', { timeControl });
  };

  const joinGame = (gameId: string) => {
    setJoiningGame(true);
    socket?.emit('join_game', { gameId });
  };

  const copyLink = () => {
    if (createdGameId) {
      navigator.clipboard.writeText(`${window.location.origin}/game/${createdGameId}`);
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 8 }}>
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 800, color: '#1a1200',
              }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{user?.username}</div>
                <span className="badge badge-gold">★ {user?.elo} ELO</span>
              </div>
            </div>

            <div className="divider" />

            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>CREATE GAME</h3>

            <div className="form-group">
              <label className="form-label">Time Control (minutes)</label>
              <select
                className="input"
                value={timeControl}
                onChange={e => setTimeControl(Number(e.target.value))}
                style={{ cursor: 'pointer' }}
              >
                <option value={1}>1 min — Bullet</option>
                <option value={3}>3 min — Bullet</option>
                <option value={5}>5 min — Blitz</option>
                <option value={10}>10 min — Rapid</option>
                <option value={15}>15 min — Rapid</option>
                <option value={30}>30 min — Classical</option>
              </select>
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={createGame} disabled={creatingGame}>
              {creatingGame ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Waiting for opponent...</> : '♟️ Create New Game'}
            </button>

            {createdGameId && (
              <div style={{ marginTop: 16, padding: 14, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Share this game ID with your opponent:</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <code style={{ flex: 1, fontSize: 11, color: 'var(--accent)', wordBreak: 'break-all' }}>{createdGameId}</code>
                  <button className="btn btn-ghost btn-sm" onClick={copyLink}>Copy</button>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>JOIN BY ID</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="input"
                placeholder="Paste game ID..."
                value={joinId}
                onChange={e => setJoinId(e.target.value)}
              />
              <button className="btn btn-secondary" onClick={() => joinGame(joinId)} disabled={!joinId || joiningGame}>
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>OPEN GAMES</h3>
          {activeGames.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>♟</div>
              <div>No open games. Create one!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeGames.map(game => (
                <div key={game.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{game.whiteUsername}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      ★ {game.whiteElo} • {Math.round(game.whiteTime / 60000)} min
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => joinGame(game.id)}
                    disabled={joiningGame}
                  >
                    Play
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
