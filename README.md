# ♟️ SparkChess

SparkChess is a real-time multiplayer chess platform featuring peer-to-peer live video and audio calling directly during games.

## Features

- Real-Time Multiplayer Gameplay with move validation powered by chess.js
- Peer-to-Peer Video and Audio Streaming using WebRTC and STUN servers
- Match Timers supporting Bullet, Blitz, Rapid, and Classical formats
- In-Game Live Chat with pre-set quick messages
- Dynamic ELO Rating Engine recalculating ratings on wins, losses, and draws
- Interactive Leaderboard tracking top-ranked players globally
- Detailed Match History and Player Profile Analytics
- Responsive Dark Chess Board Interface built with custom palettes

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, react-chessboard, chess.js, Zustand |
| Real-time & Video | Socket.io Client, WebRTC, simple-peer |
| Backend | Node.js, Express, TypeScript, Socket.io |
| Database & ORM | PostgreSQL, Prisma ORM |
| Authentication | JSON Web Tokens (JWT), bcryptjs |

## Architecture

```
Client (React + Vite)
├── react-chessboard & chess.js (Local Game State & Move Rendering)
├── Socket.io Client (Real-time Moves, Clocks, Matchmaking, Chat)
└── simple-peer (P2P WebRTC Video/Audio Stream)
       ▲                             ▲
       │ Socket.io Signaling         │ Direct P2P Media
       ▼                             ▼
Server (Node.js + Express)     Remote Peer (Opponent)
├── Socket.io (Rooms & Move Validation)
├── REST API (Auth, ELO, History)
└── Prisma ORM -> PostgreSQL
```

## Quick Start

### 1. Prerequisites

- Node.js (v18+)
- PostgreSQL database instance

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/WarmSpark/SparkChess.git
cd SparkChess
npm run install:all
```

### 3. Environment Configuration

Copy the example environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Configure your PostgreSQL connection URL and JWT secret inside `server/.env`.

### 4. Database Setup

```bash
cd server
npx prisma generate
npx prisma db push
```

### 5. Run the Application

From the root directory:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`
