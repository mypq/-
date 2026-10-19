import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';

const __dirname = path.resolve();

const app = express();
app.use(express.json());

const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function broadcastToRoom(room, message) {
  const data = JSON.stringify(message);
  for (const player of room.players) {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(data);
    }
  }
}

function stopRoomTick(room) {
  if (room.tickTimer) {
    clearInterval(room.tickTimer);
    room.tickTimer = undefined;
  }
}

function startRoomWaterTick(room) {
  stopRoomTick(room);
  room.tickTimer = setInterval(() => {
    if (room.status !== 'playing' || !room.state.isTapOpen || !room.state.tapOpenedAt) {
      stopRoomTick(room);
      return;
    }

    const now = Date.now();
    const elapsedSeconds = (now - room.state.tapOpenedAt) / 1000;
    const currentWater = room.state.waterAtTapOpen + elapsedSeconds * room.state.flowRate;

    if (currentWater >= 100) {
      room.state.waterLevel = 100;
      room.state.isTapOpen = false;
      room.state.tapOpenedAt = null;
      room.state.isOverflowed = true;
      room.status = 'game_over';
      stopRoomTick(room);

      const loser = room.players.find(p => p.id === room.state.currentTurnPlayerId);
      const winner = room.players.find(p => p.id !== room.state.currentTurnPlayerId);

      room.state.loserPlayerId = loser ? loser.id : null;
      room.state.winnerPlayerId = winner ? winner.id : null;
      if (winner) winner.score += 1;

      broadcastToRoom(room, {
        type: 'game_over',
        reason: 'overflow',
        state: sanitizeRoomState(room),
        winnerName: winner ? winner.name : 'اللاعب الفائز',
        loserName: loser ? loser.name : 'اللاعب الخاسر',
      });
    } else {
      room.state.waterLevel = Number(currentWater.toFixed(2));
      broadcastToRoom(room, {
        type: 'water_tick',
        waterLevel: room.state.waterLevel,
        isTapOpen: true,
        currentTurnPlayerId: room.state.currentTurnPlayerId,
      });
    }
  }, 40);
}

function sanitizeRoomState(room) {
  return {
    code: room.code,
    status: room.status,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      isReady: p.isReady,
      score: p.score,
      rematchRequested: p.rematchRequested,
    })),
    state: {
      currentTurnPlayerId: room.state.currentTurnPlayerId,
      waterLevel: room.state.waterLevel,
      isTapOpen: room.state.isTapOpen,
      flowRate: room.state.flowRate,
      isOverflowed: room.state.isOverflowed,
      winnerPlayerId: room.state.winnerPlayerId,
      loserPlayerId: room.state.loserPlayerId,
      roundNumber: room.state.roundNumber,
      countdown: room.state.countdown,
    },
  };
}

function startRound(room) {
  room.status = 'playing';
  room.state.waterLevel = 0;
  room.state.isTapOpen = false;
  room.state.tapOpenedAt = null;
  room.state.waterAtTapOpen = 0;
  room.state.isOverflowed = false;
  room.state.winnerPlayerId = null;
  room.state.loserPlayerId = null;
  room.state.flowRate = 12.5;
  room.state.countdown = null;

  if (!room.state.currentTurnPlayerId || room.state.roundNumber === 1) {
    room.state.currentTurnPlayerId = room.players[0].id;
  } else {
    const otherPlayer = room.players.find(p => p.id !== room.state.currentTurnPlayerId);
    room.state.currentTurnPlayerId = otherPlayer ? otherPlayer.id : room.players[0].id;
  }

  for (const p of room.players) {
    p.rematchRequested = false;
  }

  broadcastToRoom(room, {
    type: 'round_started',
    state: sanitizeRoomState(room),
  });
}

function triggerCountdown(room) {
  room.status = 'countdown';
  let count = 3;
  room.state.countdown = count;
  broadcastToRoom(room, {
    type: 'countdown_tick',
    countdown: count,
    state: sanitizeRoomState(room),
  });

  const interval = setInterval(() => {
    count--;
    room.state.countdown = count;
    if (count > 0) {
      broadcastToRoom(room, {
        type: 'countdown_tick',
        countdown: count,
      });
    } else {
      clearInterval(interval);
      startRound(room);
    }
  }, 1000);
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const socketMap = new WeakMap();

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const { type } = msg;

      if (type === 'create_room') {
        const playerName = (msg.playerName || 'اللاعب 1').trim().slice(0, 20);
        const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
        const roomCode = generateRoomCode();

        const newRoom = {
          code: roomCode,
          createdAt: Date.now(),
          status: 'waiting',
          players: [{
            id: playerId,
            name: playerName,
            ws,
            isHost: true,
            isReady: true,
            score: 0,
            rematchRequested: false,
          }],
          state: {
            currentTurnPlayerId: playerId,
            waterLevel: 0,
            isTapOpen: false,
            tapOpenedAt: null,
            waterAtTapOpen: 0,
            flowRate: 12.5,
            isOverflowed: false,
            winnerPlayerId: null,
            loserPlayerId: null,
            roundNumber: 1,
            countdown: null,
          },
        };

        rooms.set(roomCode, newRoom);
        socketMap.set(ws, { roomCode, playerId });

        ws.send(JSON.stringify({
          type: 'room_created',
          roomCode,
          playerId,
          state: sanitizeRoomState(newRoom),
        }));
        return;
      }

      if (type === 'join_room') {
        const roomCode = (msg.roomCode || '').trim().toUpperCase();
        const playerName = (msg.playerName || 'اللاعب 2').trim().slice(0, 20);
        const room = rooms.get(roomCode);

        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: 'رمز الغرفة غير صحيح.' }));
          return;
        }

        if (room.players.length >= 2) {
          ws.send(JSON.stringify({ type: 'error', message: 'الغرفة ممتلئة.' }));
          return;
        }

        const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
        const existingHost = room.players[0];
        let finalName = playerName;
        if (finalName.toLowerCase() === existingHost.name.toLowerCase()) {
          finalName = `${finalName} (2)`;
        }

        const newPlayer = {
          id: playerId,
          name: finalName,
          ws,
          isHost: false,
          isReady: true,
          score: 0,
          rematchRequested: false,
        };

        room.players.push(newPlayer);
        room.status = 'ready';
        socketMap.set(ws, { roomCode, playerId });

        ws.send(JSON.stringify({
          type: 'room_joined',
          roomCode,
          playerId,
          state: sanitizeRoomState(room),
        }));

        broadcastToRoom(room, {
          type: 'player_joined',
          joinedPlayer: { id: playerId, name: finalName },
          state: sanitizeRoomState(room),
        });

        setTimeout(() => {
          if (room.players.length === 2 && room.status === 'ready') {
            triggerCountdown(room);
          }
        }, 800);
        return;
      }

      const info = socketMap.get(ws);
      if (!info) return;
      const room = rooms.get(info.roomCode);
      if (!room) return;

      if (type === 'tap_start') {
        if (room.status !== 'playing' || room.state.currentTurnPlayerId !== info.playerId || room.state.isTapOpen) return;
        room.state.isTapOpen = true;
        room.state.tapOpenedAt = Date.now();
        room.state.waterAtTapOpen = room.state.waterLevel;
        broadcastToRoom(room, { type: 'tap_started', playerId: info.playerId, waterLevel: room.state.waterLevel });
        startRoomWaterTick(room);
        return;
      }

      if (type === 'tap_stop') {
        if (room.status !== 'playing' || room.state.currentTurnPlayerId !== info.playerId || !room.state.isTapOpen) return;
        stopRoomTick(room);
        const now = Date.now();
        const elapsed = (now - (room.state.tapOpenedAt || now)) / 1000;
        room.state.waterLevel = Number(Math.min(99.9, room.state.waterAtTapOpen + elapsed * room.state.flowRate).toFixed(2));
        room.state.isTapOpen = false;
        room.state.tapOpenedAt = null;

        const opponent = room.players.find(p => p.id !== info.playerId);
        if (opponent) room.state.currentTurnPlayerId = opponent.id;

        broadcastToRoom(room, {
          type: 'tap_stopped',
          playerId: info.playerId,
          nextTurnPlayerId: room.state.currentTurnPlayerId,
          waterLevel: room.state.waterLevel,
        });
        return;
      }

      if (type === 'request_rematch') {
        const player = room.players.find(p => p.id === info.playerId);
        if (player) player.rematchRequested = true;
        const bothReady = room.players.length === 2 && room.players.every(p => p.rematchRequested);
        if (bothReady) {
          room.state.roundNumber += 1;
          triggerCountdown(room);
        } else {
          broadcastToRoom(room, { type: 'rematch_update', playerId: info.playerId, state: sanitizeRoomState(room) });
        }
        return;
      }

      if (type === 'leave_room') {
        handlePlayerDisconnect(ws);
        return;
      }
    } catch (err) {
      console.error('Error handling WS message:', err);
    }
  });

  ws.on('close', () => handlePlayerDisconnect(ws));
  ws.on('error', (err) => console.warn('WS error:', err.message));
});

function handlePlayerDisconnect(ws) {
  const info = socketMap.get(ws);
  if (!info) return;
  const room = rooms.get(info.roomCode);
  if (!room) return;
  stopRoomTick(room);
  const leavingPlayer = room.players.find(p => p.id === info.playerId);
  room.players = room.players.filter(p => p.id !== info.playerId);

  if (room.players.length === 0) {
    rooms.delete(info.roomCode);
  } else {
    room.status = 'waiting';
    broadcastToRoom(room, {
      type: 'player_left',
      message: `غادر ${leavingPlayer ? leavingPlayer.name : 'اللاعب'} الغرفة.`,
      state: sanitizeRoomState(room),
    });
  }
}

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
