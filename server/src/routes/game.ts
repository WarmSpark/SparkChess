import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/games/:userId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const games = await prisma.game.findMany({
    where: {
      OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
    },
    include: {
      whitePlayer: { select: { id: true, username: true, elo: true } },
      blackPlayer: { select: { id: true, username: true, elo: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json(games);
});

router.get('/users/leaderboard', async (_req: AuthRequest, res: Response): Promise<void> => {
  const users = await prisma.user.findMany({
    orderBy: { elo: 'desc' },
    take: 10,
    select: { id: true, username: true, elo: true },
  });
  res.json(users);
});

router.get('/users/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, username: true, email: true, elo: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json(user);
});

export default router;
