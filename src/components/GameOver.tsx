import React from 'react';
import { Player, Team } from '../types/game';
import '../styles/GameOver.css';

interface GameOverProps {
  players: Player[];
  winningTeam: Team;
  missionHistory: boolean[];
  assassinationTarget?: Player;
}

const GameOver: React.FC<GameOverProps> = ({
  players,
  winningTeam,
  missionHistory,
  assassinationTarget
}) => {
  const goodPlayers = players.filter(p => p.team === 'GOOD');
  const evilPlayers = players.filter(p => p.team === 'EVIL');

  return (
    <div className="game-over">
      <h1 className={`victory-banner ${winningTeam.toLowerCase()}`}>
        {winningTeam === 'GOOD' ? '正义阵营胜利！' : '邪恶阵营胜利！'}
      </h1>

      {assassinationTarget && (
        <div className="assassination-result">
          <h3>刺客选择了: {assassinationTarget.name}</h3>
          <p>{assassinationTarget.role === 'Merlin' ? '成功刺杀梅林！' : '刺杀错误目标！'}</p>
        </div>
      )}

      <div className="mission-history">
        <h3>任务历史</h3>
        <div className="mission-results">
          {missionHistory.map((success, index) => (
            <div key={index} className={`mission-result ${success ? 'success' : 'fail'}`}>
              {success ? '✓' : '✗'}
            </div>
          ))}
        </div>
      </div>

      <div className="teams-reveal">
        <div className="team good">
          <h3>正义阵营</h3>
          <div className="players-list">
            {goodPlayers.map(player => (
              <div key={player.id} className="player-card">
                <div className="player-name">{player.name}</div>
                <div className="player-role">{player.role}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="team evil">
          <h3>邪恶阵营</h3>
          <div className="players-list">
            {evilPlayers.map(player => (
              <div key={player.id} className="player-card">
                <div className="player-name">{player.name}</div>
                <div className="player-role">{player.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOver;