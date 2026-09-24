export interface User {
  id: string;
  username: string;
  email: string;
  elo: number;
}

export interface GameRoom {
  id: string;
  white: { id: string; username: string; elo: number };
  black: { id: string; username: string; elo: number };
  fen: string;
  turn: 'w' | 'b';
  status: 'waiting' | 'playing' | 'finished';
  result?: string;
  whiteTime: number;
  blackTime: number;
}

export interface Move {
  from: string;
  to: string;
  promotion?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export interface ActiveGame {
  id: string;
  whiteUsername: string;
  whiteElo: number;
  whiteTime: number;
}

export interface GameHistory {
  id: string;
  whitePlayer: { id: string; username: string; elo: number };
  blackPlayer: { id: string; username: string; elo: number };
  result: string | null;
  createdAt: string;
}
