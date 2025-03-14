import { PlayerStats, Achievement } from '../types/stats';

export class StatsManager {
  private readonly STORAGE_KEY = 'awalong_stats';
  private readonly ACHIEVEMENTS_KEY = 'awalong_achievements';

  private achievements: Achievement[] = [
    {
      id: 'first_win',
      name: '初战告捷',
      description: '赢得第一场游戏',
      icon: '🏆',
      unlocked: false,
      progress: 0,
      target: 1
    },
    {
      id: 'perfect_spy',
      name: '完美间谍',
      description: '作为邪恶阵营连续成功使3次任务失败',
      icon: '🕵️',
      unlocked: false,
      progress: 0,
      target: 3
    },
    {
      id: 'merlin_master',
      name: '梅林大师',
      description: '作为梅林赢得10场游戏',
      icon: '🧙‍♂️',
      unlocked: false,
      progress: 0,
      target: 10
    }
  ];

  public getStats(playerId: string): PlayerStats {
    const stats = localStorage.getItem(`${this.STORAGE_KEY}_${playerId}`);
    return stats ? JSON.parse(stats) : this.initializeStats();
  }

  public updateStats(playerId: string, update: Partial<PlayerStats>): void {
    const currentStats = this.getStats(playerId);
    const newStats = { ...currentStats, ...update };
    localStorage.setItem(`${this.STORAGE_KEY}_${playerId}`, JSON.stringify(newStats));
    this.checkAchievements(playerId, newStats);
  }

  public getAchievements(playerId: string): Achievement[] {
    const achievements = localStorage.getItem(`${this.ACHIEVEMENTS_KEY}_${playerId}`);
    return achievements ? JSON.parse(achievements) : this.achievements;
  }

  private checkAchievements(playerId: string, stats: PlayerStats): void {
    const achievements = this.getAchievements(playerId);
    let updated = false;

    achievements.forEach(achievement => {
      switch (achievement.id) {
        case 'first_win':
          if (stats.gamesWon > 0 && !achievement.unlocked) {
            achievement.unlocked = true;
            achievement.progress = achievement.target;
            updated = true;
          }
          break;
        case 'merlin_master':
          if (stats.goodTeamWins >= achievement.target) {
            achievement.unlocked = true;
            achievement.progress = achievement.target;
            updated = true;
          } else {
            achievement.progress = stats.goodTeamWins;
            updated = true;
          }
          break;
      }
    });

    if (updated) {
      localStorage.setItem(`${this.ACHIEVEMENTS_KEY}_${playerId}`, JSON.stringify(achievements));
    }
  }

  private initializeStats(): PlayerStats {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      goodTeamWins: 0,
      evilTeamWins: 0,
      successfulMissions: 0,
      failedMissions: 0,
      teamProposalsAccepted: 0,
      teamProposalsRejected: 0,
      assassinationAttempts: 0,
      successfulAssassinations: 0
    };
  }
}