import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../hooks/useAuth';

interface LeaderboardUser {
  id: string;
  username: string;
  elo: number;
}

export default function Leaderboard() {
  const { user: currentUser } = useAuth();
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/users/leaderboard')
      .then(res => setLeaders(res.data))
      .catch(() => setLeaders([]))
      .finally(() => setLoading(false));
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>🏆 Top Players</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>
              Global ELO leaderboards on SparkChess
            </p>
          </div>
          <span className="badge badge-gold" style={{ fontSize: 13 }}>Top 10</span>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : leaders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            No players ranked yet.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Rank</th>
                <th>Player</th>
                <th style={{ textAlign: 'right' }}>ELO Rating</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((leader, index) => {
                const isMe = leader.id === currentUser?.id;
                return (
                  <tr
                    key={leader.id}
                    style={{
                      background: isMe ? 'rgba(226, 185, 111, 0.08)' : undefined,
                    }}
                  >
                    <td style={{ fontSize: 16, fontWeight: 700 }}>
                      {getRankBadge(index + 1)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: index === 0 ? 'var(--accent)' : 'var(--bg-secondary)',
                          color: index === 0 ? '#1a1200' : 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 13,
                        }}>
                          {leader.username[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: isMe ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {leader.username} {isMe && '(You)'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge badge-gold">★ {leader.elo}</span>
                    </td>
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
