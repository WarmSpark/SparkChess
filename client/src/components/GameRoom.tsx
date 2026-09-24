import { useState } from 'react';
import ChessBoard from './ChessBoard';
import Timer from './Timer';
import VideoCall from './VideoCall';
import Chat from './Chat';
import GameOver from './GameOver';
import type { ChatMessage } from '../types';

interface PlayerInfo {
  id: string;
  username: string;
  elo: number;
}

interface GameRoomProps {
  gameId: string;
  fen: string;
  myColor: 'white' | 'black';
  whitePlayer: PlayerInfo;
  blackPlayer: PlayerInfo | null;
  whiteTime: number;
  blackTime: number;
  activeTurn: 'w' | 'b';
  status: 'waiting' | 'playing' | 'finished';
  result: string | null;
  eloChange: number;
  isCheck: boolean;
  isCheckmate: boolean;
  messages: ChatMessage[];
  onPieceDrop: (source: string, target: string, piece: string) => boolean;
  onSendMessage: (text: string) => void;
  onResign: () => void;
  onOfferDraw: () => void;
  onReturnHome: () => void;
  onRematch: () => void;
  onTimeUp: (color: 'w' | 'b') => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'disconnected';
  onStartCall: () => void;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
}

export default function GameRoom({
  gameId,
  fen,
  myColor,
  whitePlayer,
  blackPlayer,
  whiteTime,
  blackTime,
  activeTurn,
  status,
  result,
  eloChange,
  isCheck,
  isCheckmate,
  messages,
  onPieceDrop,
  onSendMessage,
  onResign,
  onOfferDraw,
  onReturnHome,
  onRematch,
  onTimeUp,
  localStream,
  remoteStream,
  isVideoEnabled,
  isAudioEnabled,
  connectionStatus,
  onStartCall,
  onToggleVideo,
  onToggleAudio,
}: GameRoomProps) {
  const [copied, setCopied] = useState(false);

  const opponent = myColor === 'white' ? blackPlayer : whitePlayer;
  const me = myColor === 'white' ? whitePlayer : blackPlayer;
  const isMyTurn = (activeTurn === 'w' && myColor === 'white') || (activeTurn === 'b' && myColor === 'black');

  const copyGameId = () => {
    navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let userWon: boolean | null = null;
  if (result) {
    if (result === 'white_wins') {
      userWon = myColor === 'white';
    } else if (result === 'black_wins') {
      userWon = myColor === 'black';
    } else {
      userWon = null;
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 1280, paddingTop: 16 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        background: 'var(--bg-card)',
        padding: '10px 16px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Room:</span>
          <code style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{gameId}</code>
          <button className="btn btn-ghost btn-sm" onClick={copyGameId} style={{ padding: '2px 8px', fontSize: 11 }}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isCheck && !isCheckmate && (
            <span className="badge badge-danger">CHECK!</span>
          )}
          {status === 'playing' && (
            <span className={`badge ${isMyTurn ? 'badge-gold' : 'badge-muted'}`}>
              {isMyTurn ? 'Your Turn' : "Opponent's Turn"}
            </span>
          )}
          {status === 'waiting' && (
            <span className="badge badge-gold">Waiting for player 2</span>
          )}
          {status === 'finished' && (
            <span className="badge badge-muted">Game Ended</span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 580px) 1fr', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: myColor === 'white' ? '#222' : '#f0d9b5',
                color: myColor === 'white' ? '#fff' : '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 12,
              }}>
                {opponent?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <span style={{ fontWeight: 600 }}>{opponent?.username || 'Waiting for opponent...'}</span>
              {opponent && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({opponent.elo})</span>}
            </div>
            <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>
              {myColor === 'white' ? 'Black ♚' : 'White ♔'}
            </span>
          </div>

          <ChessBoard
            fen={fen}
            onPieceDrop={onPieceDrop}
            boardOrientation={myColor}
            disabled={status !== 'playing' || !isMyTurn}
          />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: myColor === 'white' ? '#f0d9b5' : '#222',
                color: myColor === 'white' ? '#000' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 12,
              }}>
                {me?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <span style={{ fontWeight: 600 }}>{me?.username || 'You'}</span>
              {me && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({me.elo})</span>}
            </div>
            <span className="badge badge-gold" style={{ textTransform: 'capitalize' }}>
              {myColor === 'white' ? 'White ♔ (You)' : 'Black ♚ (You)'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary"
              onClick={onOfferDraw}
              disabled={status !== 'playing'}
              style={{ flex: 1 }}
            >
              Offer Draw
            </button>
            <button
              className="btn btn-danger"
              onClick={onResign}
              disabled={status !== 'playing'}
              style={{ flex: 1 }}
            >
              Resign
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <Timer
              whiteTime={whiteTime}
              blackTime={blackTime}
              activeTurn={activeTurn}
              onTimeUp={onTimeUp}
              running={status === 'playing'}
            />
          </div>

          <VideoCall
            localStream={localStream}
            remoteStream={remoteStream}
            isVideoEnabled={isVideoEnabled}
            isAudioEnabled={isAudioEnabled}
            connectionStatus={connectionStatus}
            onStartCall={onStartCall}
            onToggleVideo={onToggleVideo}
            onToggleAudio={onToggleAudio}
            opponentName={opponent?.username || 'Opponent'}
          />

          <Chat
            messages={messages}
            onSendMessage={onSendMessage}
            disabled={status === 'finished'}
          />
        </div>
      </div>

      <GameOver
        isOpen={status === 'finished'}
        result={result || ''}
        userWon={userWon}
        eloChange={eloChange}
        onRematch={onRematch}
        onReturnHome={onReturnHome}
      />
    </div>
  );
}
