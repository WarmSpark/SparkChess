import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api';
import type { GameHistory } from '../types';

export default function Profile() {
  const { user } = useAuth();
  const [games, setGames] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/api/games/${user.id}`)
      .then(res => setGames(res.data))
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const wins = games.filter(g =>
    (g.result === 'white_wins' && g.whitePlayer.id === user?.id) ||
    (g.result === 'black_wins' && g.blackPlayer.id === user?.id)
  ).length;

  const losses = games.filter(g =>
    (g.result === 'white_wins' && g.whitePlayer.id !== user?.id) ||
    (g.result === 'black_wins' && g.blackPlayer.id !== user?.id)
  ).length;

  const draws = games.filter(g => g.result === 'draw').length;
  const winRate = games.length > 0 ? Math.round((wins / games.length) * 100) : 0;

  return (
    <div className="page-container" style={{ maxWidth: 880 }}>
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 800,
            color: '#1a1200',
          }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>{user?.username}</h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>{user?.email}</div>
            <div style={{ marginTop: 8 }}>
              <span className="badge badge-gold" style={{ fontSize: 13 }}>★ {user?.elo} ELO</span>
            </div>
          </div>
        </div>

        <div className="divider" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, textAlign: 'center' }}>
          <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{games.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Played</div>
          </div>
          <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{wins}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Wins</div>
          </div>
          <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--warning)' }}>{draws}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Draws</div>
          </div>
          <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger)' }}>{losses}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Losses</div>
          </div>
          <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{winRate}%</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Win Rate</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>
          RECENT MATCHES
        </h3>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : games.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            No matches played yet.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Opponent</th>
                <th>Color</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {games.map(game => {
                const isWhite = game.whitePlayer.id === user?.id;
                const opponent = isWhite ? game.blackPlayer : game.whitePlayer;

                let outcomeBadge = <span className="badge badge-muted">Draw</span>;
                if (game.result === 'white_wins') {
                  outcomeBadge = isWhite ? (
                    <span className="badge badge-success">Win</span>
                  ) : (
                    <span className="badge badge-danger">Loss</span>
                  );
                } else if (game.result === 'black_wins') {
                  outcomeBadge = !isWhite ? (
                    <span className="badge badge-success">Win</span>
                  ) : (
                    <span className="badge badge-danger">Loss</span>
                  );
                }

                return (
                  <tr key={game.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {new Date(game.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {opponent.username} <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({opponent.elo})</span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {isWhite ? 'White ♔' : 'Black ♚'}
                    </td>
                    <td>{outcomeBadge}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
