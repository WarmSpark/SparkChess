import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { setupGameHandler } from './gameHandler';

const prisma = new PrismaClient();

interface AuthSocket extends Socket {
  userId?: string;
  username?: string;
  elo?: number;
}

export const setupSocket = (io: Server) => {
  io.use(async (socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, elo: true },
      });
      if (!user) return next(new Error('User not found'));
      socket.userId = user.id;
      socket.username = user.username;
      socket.elo = user.elo;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    if (!socket.userId || !socket.username || socket.elo === undefined) return;
    setupGameHandler(io, socket, socket.userId, socket.username, socket.elo);
    setupRtcHandler(socket);

    socket.on('disconnect', () => {
      socket.broadcast.emit('player_disconnected', { userId: socket.userId });
    });
  });
};

const setupRtcHandler = (socket: Socket) => {
  socket.on('rtc_ready', (data: { gameId: string }) => {
    socket.to(data.gameId).emit('rtc_ready', { from: socket.id });
  });

  socket.on('rtc_offer', (data: { gameId: string; offer: unknown }) => {
    socket.to(data.gameId).emit('rtc_offer', { from: socket.id, offer: data.offer });
  });

  socket.on('rtc_answer', (data: { gameId: string; answer: unknown }) => {
    socket.to(data.gameId).emit('rtc_answer', { from: socket.id, answer: data.answer });
  });

  socket.on('ice_candidate', (data: { gameId: string; candidate: unknown }) => {
    socket.to(data.gameId).emit('ice_candidate', { from: socket.id, candidate: data.candidate });
  });
};
