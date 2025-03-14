export type Team = 'GOOD' | 'EVIL';

export type PlayerRole = 
  | 'Merlin'      // 梅林
  | 'Assassin'    // 刺客
  | 'Percival'    // 派西维尔
  | 'Morgana'     // 莫甘娜
  | 'Mordred'     // 莫德雷德
  | 'Oberon'      // 奥伯伦
  | 'LoyalServant' // 忠臣
  | 'EvilServant'; // 爪牙

export interface RoleInfo {
  role: PlayerRole;
  team: Team;
  canSeeEvil: boolean;
  specialAbility?: string;
}

export type GamePhase = 
  | 'WAITING'     // 等待玩家加入
  | 'STARTED'     // 游戏开始，分配角色
  | 'TEAM_BUILDING' // 组队阶段
  | 'TEAM_VOTE'    // 队伍投票
  | 'MISSION'      // 任务执行
  | 'ASSASSINATE'  // 刺客刺杀
  | 'GAME_OVER';   // 游戏结束

export interface Player {
  id: string;
  name: string;
  role?: PlayerRole;
  isLeader?: boolean;
  team?: Team;
  voteHistory?: boolean[];
  revealed?: boolean;  // Added for game end
}

export interface Vote {
  playerId: string;
  approve: boolean;
}

export interface GameState {
  winner: Team;
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
}