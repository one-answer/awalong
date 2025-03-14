import { GameState, Player, PlayerRole, Team, Vote } from '../types/game';
import { PLAYER_COUNT_CONFIG, ROLE_CONFIG, MISSION_REQUIREMENTS } from '../config/roles';

export class GameManager {
  private gameState: GameState;

  constructor(gameId: string) {
    this.gameState = {
      winner: 'NONE' as Team,
      gameId,
      phase: 'WAITING',
      players: [],
      currentRound: 0,
      currentMission: 0,
      missionResults: [],
      teamProposals: [],
      missionHistory: [],
      consecutiveVoteFailures: 0,
      votingHistory: []
    };
  }

  public addPlayer(player: Player): boolean {
    if (this.gameState.players.length >= 10) return false;
    this.gameState.players.push(player);
    return true;
  }

  public startGame(): boolean {
    const playerCount = this.gameState.players.length;
    if (playerCount < 5 || playerCount > 10) return false;

    const roles = [...PLAYER_COUNT_CONFIG[playerCount]];
    this.shuffleArray(roles);

    this.gameState.players.forEach((player, index) => {
      player.role = roles[index];
      player.team = ROLE_CONFIG[roles[index]].team as Team;
      player.voteHistory = [];
      player.revealed = false;
    });

    const firstLeader = Math.floor(Math.random() * playerCount);
    this.gameState.players[firstLeader].isLeader = true;

    this.gameState.phase = 'TEAM_BUILDING';
    this.gameState.currentMission = 0;
    this.gameState.missionHistory = [];
    this.gameState.consecutiveVoteFailures = 0;
    
    return true;
  }

  public proposeTeam(leaderId: string, proposedTeamIds: string[]): boolean {
    if (this.gameState.phase !== 'TEAM_BUILDING') return false;
    
    const leader = this.gameState.players.find(p => p.id === leaderId);
    if (!leader?.isLeader) return false;

    const requiredTeamSize = MISSION_REQUIREMENTS[this.gameState.players.length][this.gameState.currentMission];
    if (proposedTeamIds.length !== requiredTeamSize) return false;

    const proposedTeam = proposedTeamIds
      .map(id => this.gameState.players.find(p => p.id === id))
      .filter((p): p is Player => p !== undefined);

    if (proposedTeam.length !== requiredTeamSize) return false;

    this.gameState.teamProposals = proposedTeam;
    this.gameState.phase = 'TEAM_VOTE';
    this.gameState.votingHistory = [];
    return true;
  }

  public submitTeamVote(playerId: string, approve: boolean): boolean {
    if (this.gameState.phase !== 'TEAM_VOTE') return false;
    
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) return false;
    
    if (this.gameState.votingHistory.some(vote => vote.playerId === playerId)) {
      return false;
    }

    const vote: Vote = { playerId, approve };
    this.gameState.votingHistory.push(vote);
    player.voteHistory?.push(approve);

    if (this.gameState.votingHistory.length === this.gameState.players.length) {
      this.resolveTeamVote();
    }

    return true;
  }

  public submitMissionVote(playerId: string, success: boolean): boolean {
    if (this.gameState.phase !== 'MISSION') return false;
    
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || !this.gameState.teamProposals.some(p => p.id === playerId)) {
      return false;
    }

    if (player.team === 'GOOD' && !success) return false;

    this.gameState.missionResults.push(success);
    
    if (this.gameState.missionResults.length === this.gameState.teamProposals.length) {
      this.resolveMission();
    }

    return true;
  }

  public submitAssassination(assassinId: string, targetId: string): boolean {
    if (this.gameState.phase !== 'ASSASSINATE') return false;

    const assassin = this.gameState.players.find(p => p.id === assassinId);
    if (!assassin || assassin.role !== 'Assassin') return false;

    const target = this.gameState.players.find(p => p.id === targetId);
    if (!target) return false;

    const assassinationSuccessful = target.role === 'Merlin';
    this.endGame(assassinationSuccessful ? 'EVIL' : 'GOOD');
    return true;
  }

  private resolveTeamVote(): void {
    const approvalCount = this.gameState.votingHistory.filter(vote => vote.approve).length;
    const majority = this.gameState.players.length / 2;

    if (approvalCount > majority) {
      this.gameState.phase = 'MISSION';
      this.gameState.consecutiveVoteFailures = 0;
      this.gameState.missionResults = [];
    } else {
      this.gameState.consecutiveVoteFailures++;
      if (this.gameState.consecutiveVoteFailures >= 5) {
        this.endGame('EVIL');
        return;
      }
      this.rotateLeader();
      this.gameState.phase = 'TEAM_BUILDING';
    }
  }

  private resolveMission(): void {
    const failCount = this.gameState.missionResults.filter(result => !result).length;
    const playerCount = this.gameState.players.length;
    
    const missionFailed = this.gameState.currentMission === 3 && playerCount >= 7 
      ? failCount >= 2 
      : failCount > 0;

    this.gameState.missionHistory.push(!missionFailed);
    
    const successCount = this.gameState.missionHistory.filter(result => result).length;
    const failureCount = this.gameState.missionHistory.filter(result => !result).length;

    if (successCount >= 3) {
      this.gameState.phase = 'ASSASSINATE';
    } else if (failureCount >= 3) {
      this.endGame('EVIL');
    } else {
      this.gameState.currentMission++;
      this.rotateLeader();
      this.gameState.phase = 'TEAM_BUILDING';
      this.gameState.teamProposals = [];
    }
  }

  private endGame(winningTeam: Team): void {
    this.gameState.phase = 'GAME_OVER';
    this.gameState.winner = winningTeam;
    this.gameState.players.forEach(player => {
      player.revealed = true;
    });
  }

  private rotateLeader(): void {
    const currentLeaderIndex = this.gameState.players.findIndex(p => p.isLeader);
    this.gameState.players[currentLeaderIndex].isLeader = false;
    const nextLeaderIndex = (currentLeaderIndex + 1) % this.gameState.players.length;
    this.gameState.players[nextLeaderIndex].isLeader = true;
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  public getCurrentState(): GameState {
    return { ...this.gameState };
  }

  public loadState(state: GameState): void {
    this.gameState = state;
  }
}