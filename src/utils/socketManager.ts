import { io, Socket } from 'socket.io-client';
import { GameState, Player } from '../types/game';
import { StatsManager } from './statsManager';
import { Message } from '../types/message';
import { PlayerStats } from '../types/stats';

export class SocketManager {
  private socket: Socket;
  private gameId: string;
  private statsManager: StatsManager;

  constructor(gameId: string) {
    this.gameId = gameId;
    this.socket = io('http://localhost:3001', {
      query: { gameId },
      transports: ['websocket'],
      withCredentials: false
    });
    this.statsManager = new StatsManager();
  }

  public connect(onStateUpdate: (state: GameState) => void): void {
    this.socket.on('gameStateUpdate', onStateUpdate);
    this.socket.emit('joinGame', this.gameId);
  }

  public disconnect(): void {
    this.socket.disconnect();
  }

  public addPlayer(player: Player): void {
    this.socket.emit('addPlayer', { gameId: this.gameId, player });
  }

  public startGame(): void {
    this.socket.emit('startGame', this.gameId);
  }

  public proposeTeam(leaderId: string, proposedTeamIds: string[]): void {
    this.socket.emit('proposeTeam', {
      gameId: this.gameId,
      leaderId,
      proposedTeamIds
    });
  }

  public submitTeamVote(playerId: string, approve: boolean): void {
    this.socket.emit('submitTeamVote', {
      gameId: this.gameId,
      playerId,
      approve
    });
  }

  public submitMissionVote(playerId: string, success: boolean): void {
    this.socket.emit('submitMissionVote', {
      gameId: this.gameId,
      playerId,
      success
    });
  }

  public submitAssassination(assassinId: string, targetId: string): void {
    this.socket.emit('submitAssassination', {
      gameId: this.gameId,
      assassinId,
      targetId
    });
  }

  public sendMessage(content: string): void {
    this.socket.emit('sendMessage', {
      gameId: this.gameId,
      content
    });
  }

  public onMessage(callback: (message: Message) => void): void {
    this.socket.on('newMessage', callback);
  }

  public onTimeout(callback: () => void): void {
    this.socket.on('phaseTimeout', callback);
  }

  public onGameEnd(callback: (stats: PlayerStats) => void): void {
    this.socket.on('gameEnd', ({ playerId, stats }) => {
      this.statsManager.updateStats(playerId, stats);
      callback(this.statsManager.getStats(playerId));
    });
  }
}