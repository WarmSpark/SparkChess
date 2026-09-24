import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { disconnectSocket } from '../hooks/useSocket';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const refreshUser = useAuthStore(s => s.refreshUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      refreshUser();
    }
  }, [isAuthenticated, refreshUser]);

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <span style={{ fontSize: 24 }}>♟️</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.5px' }}>SparkChess</span>
      </Link>

      {isAuthenticated() ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>Play</Link>
          <Link to="/leaderboard" style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>Leaderboard</Link>
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: '#1a1200',
            }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.username}</div>
              <div style={{ fontSize: 11, color: 'var(--accent)' }}>★ {user?.elo}</div>
            </div>
          </Link>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
        </div>
      )}
    </nav>
  );
}
