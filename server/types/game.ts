export type Team = 'GOOD' | 'EVIL' | 'NONE';

export type PlayerRole = 'Merlin' | 'Percival' | 'Loyal Servant' | 'Assassin' | 'Morgana' | 'Mordred' | 'Oberon';

export interface Player {
  id: string;
  name: string;
  role?: PlayerRole;
  team?: Team;
  isLeader?: boolean;
  revealed?: boolean;
  voteHistory?: boolean[];
}

export interface Vote {
  playerId: string;
  approve: boolean;
}

export type GamePhase = 'WAITING' | 'TEAM_BUILDING' | 'TEAM_VOTE' | 'MISSION' | 'ASSASSINATE' | 'GAME_OVER';

export interface GameState {
  gameId: string;
  phase: GamePhase;
  players: Player[];
  currentRound: number;
  currentMission: number;
  missionResults: boolean[];
  teamProposals: Player[];
  missionHistory: boolean[];
  consecutiveVoteFailures: number;
  votingHistory: Vote[];
  winner: Team;
}