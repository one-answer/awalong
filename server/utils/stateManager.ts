import fs from 'fs/promises';
import path from 'path';
import { GameState } from '../types/game';

export class StateManager {
  private readonly storageDir: string;

  constructor() {
    this.storageDir = path.join(__dirname, '../storage');
    this.initStorage();
  }

  private async initStorage() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  public async saveGameState(gameId: string, state: GameState): Promise<void> {
    try {
      const filePath = path.join(this.storageDir, `${gameId}.json`);
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error(`Failed to save game state for ${gameId}:`, error);
    }
  }

  public async loadGameState(gameId: string): Promise<GameState | null> {
    try {
      const filePath = path.join(this.storageDir, `${gameId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as GameState;
    } catch (error) {
      return null;
    }
  }

  public async deleteGameState(gameId: string): Promise<void> {
    try {
      const filePath = path.join(this.storageDir, `${gameId}.json`);
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete game state for ${gameId}:`, error);
    }
  }
}