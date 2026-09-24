import { useRef, useEffect } from 'react';

interface VideoCallProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'disconnected';
  onStartCall: () => void;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  opponentName: string;
}

export default function VideoCall({
  localStream,
  remoteStream,
  isVideoEnabled,
  isAudioEnabled,
  connectionStatus,
  onStartCall,
  onToggleVideo,
  onToggleAudio,
  opponentName,
}: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const statusColor = {
    idle: 'var(--text-muted)',
    connecting: 'var(--warning)',
    connected: 'var(--success)',
    disconnected: 'var(--danger)',
  }[connectionStatus];

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000', minHeight: 140 }}>
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--bg-card), var(--border))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: 'var(--text-secondary)',
            }}>
              {opponentName?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{opponentName || 'Opponent'}</div>
          </div>
        )}

        {localStream && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            width: 72, height: 54,
            borderRadius: 8,
            overflow: 'hidden',
            border: '2px solid var(--accent)',
            background: '#000',
          }}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
          </div>
        )}

        <div style={{
          position: 'absolute', top: 8, left: 8,
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(0,0,0,0.6)',
          padding: '3px 8px',
          borderRadius: 20,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor }} />
          <span style={{ fontSize: 11, color: 'white', textTransform: 'capitalize' }}>{connectionStatus}</span>
        </div>
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', gap: 8, justifyContent: 'center' }}>
        {connectionStatus === 'idle' ? (
          <button className="btn btn-primary btn-sm" onClick={onStartCall} style={{ flex: 1 }}>
            📹 Start Video
          </button>
        ) : (
          <>
            <button
              className="btn btn-sm"
              onClick={onToggleVideo}
              style={{
                flex: 1,
                background: isVideoEnabled ? 'var(--bg-card)' : 'var(--danger)',
                color: 'white',
                border: '1px solid var(--border)',
              }}
            >
              {isVideoEnabled ? '📹' : '🚫'} Cam
            </button>
            <button
              className="btn btn-sm"
              onClick={onToggleAudio}
              style={{
                flex: 1,
                background: isAudioEnabled ? 'var(--bg-card)' : 'var(--danger)',
                color: 'white',
                border: '1px solid var(--border)',
              }}
            >
              {isAudioEnabled ? '🎤' : '🔇'} Mic
            </button>
          </>
        )}
      </div>
    </div>
  );
}
