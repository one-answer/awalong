export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  goodTeamWins: number;
  evilTeamWins: number;
  successfulMissions: number;
  failedMissions: number;
  teamProposalsAccepted: number;
  teamProposalsRejected: number;
  assassinationAttempts: number;
  successfulAssassinations: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
}