import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 64 }}>♟️</div>
      <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent)' }}>404</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
        Square not found. The page you are looking for does not exist.
      </p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 8 }}>
        Return to Lobby
      </Link>
    </div>
  );
}
