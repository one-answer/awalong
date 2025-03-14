import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GameManager } from './utils/gameManager';
import { ConnectionManager } from './utils/connectionManager';
import { StateManager } from './utils/stateManager';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",  // 允许所有来源
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: false
  }
});

const games = new Map<string, GameManager>();
const connections = new Map<string, ConnectionManager>();
const stateManager = new StateManager();

io.on('connection', async (socket) => {
  const { gameId } = socket.handshake.query;
  
  if (typeof gameId !== 'string') {
    socket.emit('error', { message: '无效的游戏ID' });
    socket.disconnect();
    return;
  }

  if (!games.has(gameId)) {
    const savedState = await stateManager.loadGameState(gameId);
    const game = new GameManager(gameId);
    if (savedState) {
      game.loadState(savedState);
    }
    games.set(gameId, game);
    connections.set(gameId, new ConnectionManager());
  }
  
  const game = games.get(gameId)!;
  const connectionManager = connections.get(gameId)!;

  socket.join(gameId);

  const handleError = (error: any) => {
    console.error(`Game ${gameId} error:`, error);
    socket.emit('error', { message: '操作失败，请重试' });
  };

  socket.on('joinGame', (playerId: string) => {
    try {
      connectionManager.addConnection(socket.id, playerId);
      io.to(gameId).emit('gameStateUpdate', game.getCurrentState());
    } catch (error) {
      handleError(error);
    }
  });

  // 在每次状态更新后保存游戏状态
  const updateAndSaveState = async () => {
    const state = game.getCurrentState();
    io.to(gameId).emit('gameStateUpdate', state);
    await stateManager.saveGameState(gameId, state);
  };

  socket.on('addPlayer', async ({ player }) => {
    try {
      if (game.addPlayer(player)) {
        connectionManager.addConnection(socket.id, player.id);
        await updateAndSaveState();
      }
    } catch (error) {
      handleError(error);
    }
  });

  // 更新其他事件处理器以使用 updateAndSaveState
  socket.on('startGame', async () => {
    if (game.startGame()) {
      await updateAndSaveState();
    }
  });

  socket.on('proposeTeam', ({ leaderId, proposedTeamIds }) => {
    if (game.proposeTeam(leaderId, proposedTeamIds)) {
      io.to(gameId).emit('gameStateUpdate', game.getCurrentState());
    }
  });

  socket.on('submitTeamVote', ({ playerId, approve }) => {
    if (game.submitTeamVote(playerId, approve)) {
      io.to(gameId).emit('gameStateUpdate', game.getCurrentState());
    }
  });

  socket.on('submitMissionVote', ({ playerId, success }) => {
    if (game.submitMissionVote(playerId, success)) {
      io.to(gameId).emit('gameStateUpdate', game.getCurrentState());
    }
  });

  socket.on('submitAssassination', ({ assassinId, targetId }) => {
    if (game.submitAssassination(assassinId, targetId)) {
      io.to(gameId).emit('gameStateUpdate', game.getCurrentState());
    }
  });

  socket.on('disconnect', () => {
    try {
      const playerId = connectionManager.getPlayerId(socket.id);
      connectionManager.removeConnection(socket.id);
      
      if (playerId && !connectionManager.isPlayerConnected(playerId)) {
        // 玩家完全断开连接，可以在这里添加额外处理
        io.to(gameId).emit('playerDisconnected', { playerId });
      }
    } catch (error) {
      console.error(`Disconnect error in game ${gameId}:`, error);
    }
  });
});

// 定期清理空闲的游戏房间
setInterval(() => {
  for (const [gameId, game] of games.entries()) {
    const connectionManager = connections.get(gameId);
    if (connectionManager && game.getCurrentState().players.length === 0) {
      games.delete(gameId);
      connections.delete(gameId);
      stateManager.deleteGameState(gameId).catch(error => {
        console.error(`Failed to delete game state for ${gameId}:`, error);
      });
      console.log(`Cleaned up empty game: ${gameId}`);
    }
  }
}, 1000 * 60 * 60); // 每小时清理一次

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});