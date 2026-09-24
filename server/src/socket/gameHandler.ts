import { Chess } from 'chess.js';
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { calculateElo } from '../utils/elo';

const prisma = new PrismaClient();

interface GameState {
  id: string;
  chess: Chess;
  whiteId: string;
  blackId: string | null;
  whiteUsername: string;
  blackUsername: string | null;
  whiteElo: number;
  blackElo: number | null;
  status: 'waiting' | 'playing' | 'finished';
  result: string | null;
  whiteTime: number;
  blackTime: number;
  lastMoveTime: number | null;
}

const activeGames = new Map<string, GameState>();

export const setupGameHandler = (io: Server, socket: Socket, userId: string, username: string, elo: number) => {
  socket.on('create_game', (data: { timeControl: number }) => {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timeMs = (data.timeControl || 10) * 60 * 1000;
    const game: GameState = {
      id: gameId,
      chess: new Chess(),
      whiteId: userId,
      blackId: null,
      whiteUsername: username,
      blackUsername: null,
      whiteElo: elo,
      blackElo: null,
      status: 'waiting',
      result: null,
      whiteTime: timeMs,
      blackTime: timeMs,
      lastMoveTime: null,
    };
    activeGames.set(gameId, game);
    socket.join(gameId);
    socket.emit('game_created', { gameId });
    io.emit('active_games_update', getActiveGamesList());
  });

  socket.on('join_game', async (data: { gameId: string }) => {
    const game = activeGames.get(data.gameId);
    if (!game || game.status !== 'waiting' || game.whiteId === userId) {
      socket.emit('error', { message: 'Cannot join this game' });
      return;
    }
    game.blackId = userId;
    game.blackUsername = username;
    game.blackElo = elo;
    game.status = 'playing';
    game.lastMoveTime = Date.now();
    socket.join(data.gameId);
    io.to(data.gameId).emit('game_started', {
      gameId: data.gameId,
      fen: game.chess.fen(),
      white: { id: game.whiteId, username: game.whiteUsername, elo: game.whiteElo },
      black: { id: game.blackId, username: game.blackUsername, elo: game.blackElo },
      whiteTime: game.whiteTime,
      blackTime: game.blackTime,
    });
    io.emit('active_games_update', getActiveGamesList());
  });

  socket.on('make_move', async (data: { gameId: string; move: { from: string; to: string; promotion?: string } }) => {
    const game = activeGames.get(data.gameId);
    if (!game || game.status !== 'playing') return;

    const isWhiteTurn = game.chess.turn() === 'w';
    const isCorrectPlayer = (isWhiteTurn && userId === game.whiteId) || (!isWhiteTurn && userId === game.blackId);
    if (!isCorrectPlayer) return;

    if (game.lastMoveTime) {
      const elapsed = Date.now() - game.lastMoveTime;
      if (isWhiteTurn) {
        game.whiteTime = Math.max(0, game.whiteTime - elapsed);
      } else {
        game.blackTime = Math.max(0, game.blackTime - elapsed);
      }
    }

    try {
      const move = game.chess.move(data.move);
      if (!move) return;
      game.lastMoveTime = Date.now();

      io.to(data.gameId).emit('move_made', {
        move: data.move,
        fen: game.chess.fen(),
        whiteTime: game.whiteTime,
        blackTime: game.blackTime,
        pgn: game.chess.pgn(),
      });

      if (game.chess.isGameOver()) {
        let result = 'draw';
        let winnerId: string | null = null;
        let loserId: string | null = null;

        if (game.chess.isCheckmate()) {
          result = isWhiteTurn ? 'black_wins' : 'white_wins';
          winnerId = isWhiteTurn ? game.blackId : game.whiteId;
          loserId = isWhiteTurn ? game.whiteId : game.blackId;
        }
        await endGame(io, game, result, winnerId, loserId);
      }
    } catch {
      socket.emit('error', { message: 'Invalid move' });
    }
  });

  socket.on('resign', async (data: { gameId: string }) => {
    const game = activeGames.get(data.gameId);
    if (!game || game.status !== 'playing') return;
    const isWhite = userId === game.whiteId;
    const result = isWhite ? 'black_wins' : 'white_wins';
    const winnerId = isWhite ? game.blackId : game.whiteId;
    const loserId = userId;
    await endGame(io, game, result, winnerId, loserId);
  });

  socket.on('offer_draw', (data: { gameId: string }) => {
    socket.to(data.gameId).emit('draw_offered', { from: username });
  });

  socket.on('accept_draw', async (data: { gameId: string }) => {
    const game = activeGames.get(data.gameId);
    if (!game || game.status !== 'playing') return;
    await endGame(io, game, 'draw', null, null);
  });

  socket.on('decline_draw', (data: { gameId: string }) => {
    socket.to(data.gameId).emit('draw_declined');
  });

  socket.on('get_active_games', () => {
    socket.emit('active_games', getActiveGamesList());
  });

  socket.on('send_message', (data: { gameId: string; text: string }) => {
    io.to(data.gameId).emit('message', {
      id: Date.now().toString(),
      sender: username,
      text: data.text,
      timestamp: Date.now(),
    });
  });

  socket.on('rejoin_game', (data: { gameId: string }) => {
    const game = activeGames.get(data.gameId);
    if (!game) return;
    socket.join(data.gameId);
    socket.emit('game_rejoined', {
      fen: game.chess.fen(),
      whiteTime: game.whiteTime,
      blackTime: game.blackTime,
      status: game.status,
    });
  });
};

const getActiveGamesList = () => {
  return Array.from(activeGames.values())
    .filter(g => g.status === 'waiting')
    .map(g => ({
      id: g.id,
      whiteUsername: g.whiteUsername,
      whiteElo: g.whiteElo,
      whiteTime: g.whiteTime,
    }));
};

const endGame = async (io: Server, game: GameState, result: string, winnerId: string | null, loserId: string | null) => {
  game.status = 'finished';
  game.result = result;

  let whiteEloDelta = 0;
  let blackEloDelta = 0;

  if (winnerId && loserId) {
    const isWinnerWhite = winnerId === game.whiteId;
    const winnerElo = isWinnerWhite ? game.whiteElo : (game.blackElo || 1200);
    const loserElo = isWinnerWhite ? (game.blackElo || 1200) : game.whiteElo;
    const { newWinnerElo, newLoserElo } = calculateElo(winnerElo, loserElo);
    const winnerDelta = newWinnerElo - winnerElo;
    const loserDelta = newLoserElo - loserElo;

    if (isWinnerWhite) {
      whiteEloDelta = winnerDelta;
      blackEloDelta = loserDelta;
    } else {
      blackEloDelta = winnerDelta;
      whiteEloDelta = loserDelta;
    }

    await prisma.user.update({ where: { id: winnerId }, data: { elo: { increment: winnerDelta } } });
    await prisma.user.update({ where: { id: loserId }, data: { elo: { decrement: Math.abs(loserDelta) } } });
  }

  await prisma.game.create({
    data: {
      whitePlayerId: game.whiteId,
      blackPlayerId: game.blackId || game.whiteId,
      pgn: game.chess.pgn(),
      result,
    },
  });

  io.to(game.id).emit('game_over', {
    result,
    whiteEloDelta,
    blackEloDelta,
  });

  setTimeout(() => activeGames.delete(game.id), 60000);
};
