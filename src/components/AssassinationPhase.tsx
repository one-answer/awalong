import React from 'react';
import { Player } from '../types/game';
import '../styles/AssassinationPhase.css';

interface AssassinationPhaseProps {
  players: Player[];
  onAssassinate: (targetId: string) => void;
}

const AssassinationPhase: React.FC<AssassinationPhaseProps> = ({
  players,
  onAssassinate
}) => {
  const goodPlayers = players.filter(p => p.team === 'GOOD');

  return (
    <div className="assassination-phase">
      <h2>刺客阶段</h2>
      <p className="instruction">选择一名玩家作为刺杀目标。如果成功刺杀梅林，邪恶阵营获胜！</p>
      
      <div className="targets-grid">
        {goodPlayers.map(player => (
          <div
            key={player.id}
            className="target-card"
            onClick={() => onAssassinate(player.id)}
          >
            <div className="player-name">{player.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssassinationPhase;