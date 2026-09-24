import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { useAuth } from '../hooks/useAuth';
import { useSocket, initSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import GameRoom from '../components/GameRoom';
import type { ChatMessage } from '../types';

export default function Game() {
  const { id: gameId } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();

  const chessRef = useRef(new Chess());
  const [fen, setFen] = useState(chessRef.current.fen());
  const [myColor, setMyColor] = useState<'white' | 'black'>('white');
  const [whitePlayer, setWhitePlayer] = useState({ id: '', username: '', elo: 1200 });
  const [blackPlayer, setBlackPlayer] = useState({ id: '', username: '', elo: 1200 });
  const [whiteTime, setWhiteTime] = useState(600000);
  const [blackTime, setBlackTime] = useState(600000);
  const [activeTurn, setActiveTurn] = useState<'w' | 'b'>('w');
  const [status, setStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [result, setResult] = useState<string | null>(null);
  const [eloChange, setEloChange] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isCheck, setIsCheck] = useState(false);
  const [isCheckmate, setIsCheckmate] = useState(false);

  const isInitiator = myColor === 'white';
  const {
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    connectionStatus,
    startCall,
    toggleVideo,
    toggleAudio,
    endCall,
  } = useWebRTC({
    socket,
    gameId: gameId || '',
    isInitiator,
  });

  const updateBoardState = useCallback(() => {
    setFen(chessRef.current.fen());
    setActiveTurn(chessRef.current.turn());
    setIsCheck(chessRef.current.isCheck());
    setIsCheckmate(chessRef.current.isCheckmate());
  }, []);

  useEffect(() => {
    if (!token || !gameId) return;
    const s = initSocket(token);

    s.emit('rejoin_game', { gameId });

    s.on('game_started', (data: {
      gameId: string;
      fen: string;
      white: { id: string; username: string; elo: number };
      black: { id: string; username: string; elo: number };
      whiteTime: number;
      blackTime: number;
    }) => {
      chessRef.current.load(data.fen);
      updateBoardState();
      setWhitePlayer(data.white);
      setBlackPlayer(data.black);
      setWhiteTime(data.whiteTime);
      setBlackTime(data.blackTime);
      setStatus('playing');
      if (user?.id === data.white.id) {
        setMyColor('white');
      } else {
        setMyColor('black');
      }
    });

    s.on('move_made', (data: {
      move: { from: string; to: string; promotion?: string };
      fen: string;
      whiteTime: number;
      blackTime: number;
    }) => {
      try {
        chessRef.current.move(data.move);
      } catch {
        chessRef.current.load(data.fen);
      }
      updateBoardState();
      setWhiteTime(data.whiteTime);
      setBlackTime(data.blackTime);
    });

    s.on('game_rejoined', (data: {
      fen: string;
      whiteTime: number;
      blackTime: number;
      status: 'waiting' | 'playing' | 'finished';
    }) => {
      if (data.fen) {
        chessRef.current.load(data.fen);
        updateBoardState();
      }
      if (data.whiteTime) setWhiteTime(data.whiteTime);
      if (data.blackTime) setBlackTime(data.blackTime);
      if (data.status) setStatus(data.status);
    });

    s.on('game_over', (data: {
      result: string;
      whiteEloDelta: number;
      blackEloDelta: number;
    }) => {
      setStatus('finished');
      setResult(data.result);
      if (myColor === 'white') {
        setEloChange(data.whiteEloDelta);
      } else {
        setEloChange(data.blackEloDelta);
      }
    });

    s.on('draw_offered', ({ from }: { from: string }) => {
      const accept = window.confirm(`${from} offered a draw. Accept?`);
      if (accept) {
        s.emit('accept_draw', { gameId });
      } else {
        s.emit('decline_draw', { gameId });
      }
    });

    s.on('draw_declined', () => {
      alert('Draw offer was declined.');
    });

    s.on('message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      s.off('game_started');
      s.off('move_made');
      s.off('game_rejoined');
      s.off('game_over');
      s.off('draw_offered');
      s.off('draw_declined');
      s.off('message');
    };
  }, [token, gameId, user?.id, myColor, updateBoardState]);

  const handlePieceDrop = (sourceSquare: string, targetSquare: string, piece: string): boolean => {
    const isPawnPromotion =
      piece[1]?.toLowerCase() === 'p' &&
      ((piece[0] === 'w' && targetSquare[1] === '8') || (piece[0] === 'b' && targetSquare[1] === '1'));

    const movePayload = {
      from: sourceSquare,
      to: targetSquare,
      promotion: isPawnPromotion ? 'q' : undefined,
    };

    try {
      const move = chessRef.current.move(movePayload);
      if (!move) return false;
      updateBoardState();
      socket?.emit('make_move', {
        gameId,
        move: movePayload,
      });
      return true;
    } catch {
      return false;
    }
  };

  const handleSendMessage = (text: string) => {
    if (!gameId) return;
    socket?.emit('send_message', { gameId, text });
  };

  const handleResign = () => {
    if (!gameId) return;
    const confirm = window.confirm('Are you sure you want to resign?');
    if (confirm) {
      socket?.emit('resign', { gameId });
    }
  };

  const handleOfferDraw = () => {
    if (!gameId) return;
    socket?.emit('offer_draw', { gameId });
  };

  const handleTimeUp = (color: 'w' | 'b') => {
    if (status !== 'playing' || !gameId) return;
    const resigningColor = color === 'w' ? 'white' : 'black';
    if (myColor === resigningColor) {
      socket?.emit('resign', { gameId });
    }
  };

  const handleReturnHome = () => {
    endCall();
    navigate('/');
  };

  const handleRematch = () => {
    endCall();
    navigate('/');
  };

  if (!gameId) {
    return <div className="page-container">Invalid Game</div>;
  }

  return (
    <GameRoom
      gameId={gameId}
      fen={fen}
      myColor={myColor}
      whitePlayer={whitePlayer}
      blackPlayer={blackPlayer}
      whiteTime={whiteTime}
      blackTime={blackTime}
      activeTurn={activeTurn}
      status={status}
      result={result}
      eloChange={eloChange}
      isCheck={isCheck}
      isCheckmate={isCheckmate}
      messages={messages}
      onPieceDrop={handlePieceDrop}
      onSendMessage={handleSendMessage}
      onResign={handleResign}
      onOfferDraw={handleOfferDraw}
      onReturnHome={handleReturnHome}
      onRematch={handleRematch}
      onTimeUp={handleTimeUp}
      localStream={localStream}
      remoteStream={remoteStream}
      isVideoEnabled={isVideoEnabled}
      isAudioEnabled={isAudioEnabled}
      connectionStatus={connectionStatus}
      onStartCall={startCall}
      onToggleVideo={toggleVideo}
      onToggleAudio={toggleAudio}
    />
  );
}
