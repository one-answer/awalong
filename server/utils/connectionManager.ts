

export class ConnectionManager {
  private playerConnections: Map<string, Set<string>> = new Map(); // playerId -> socketIds
  private socketPlayers: Map<string, string> = new Map(); // socketId -> playerId

  public addConnection(socketId: string, playerId: string) {
    if (!this.playerConnections.has(playerId)) {
      this.playerConnections.set(playerId, new Set());
    }
    this.playerConnections.get(playerId)!.add(socketId);
    this.socketPlayers.set(socketId, playerId);
  }

  public removeConnection(socketId: string) {
    const playerId = this.socketPlayers.get(socketId);
    if (playerId) {
      const connections = this.playerConnections.get(playerId);
      if (connections) {
        connections.delete(socketId);
        if (connections.size === 0) {
          this.playerConnections.delete(playerId);
        }
      }
      this.socketPlayers.delete(socketId);
    }
  }

  public isPlayerConnected(playerId: string): boolean {
    return this.playerConnections.has(playerId) && 
           this.playerConnections.get(playerId)!.size > 0;
  }

  public getPlayerId(socketId: string): string | undefined {
    return this.socketPlayers.get(socketId);
  }
}