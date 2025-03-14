import React, { useState } from 'react';
import { Player } from '../types/game';
import '../styles/TeamSelection.css';

interface TeamSelectionProps {
  players: Partial<Player>[];
  currentPlayerId: string;
  requiredPlayers: number;
  onTeamConfirm: (selectedPlayers: string[]) => void;
}

const TeamSelection: React.FC<TeamSelectionProps> = ({
  players,
  currentPlayerId,
  requiredPlayers,
  onTeamConfirm,
}) => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const isLeader = players.find(p => p.id === currentPlayerId)?.isLeader;

  const handlePlayerSelect = (playerId: string) => {
    if (!isLeader) return;

    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      }
      if (prev.length < requiredPlayers) {
        return [...prev, playerId];
      }
      return prev;
    });
  };

  const handleConfirm = () => {
    if (selectedPlayers.length === requiredPlayers) {
      onTeamConfirm(selectedPlayers);
    }
  };

  return (
    <div className="team-selection">
      <h2>选择任务队员</h2>
      <div className="team-info">
        {isLeader ? (
          <p className="leader-hint">请选择 {requiredPlayers} 名队员执行任务</p>
        ) : (
          <p className="waiting-hint">等待队长选择队员...</p>
        )}
      </div>

      <div className="players-grid">
        {players.map(player => (
          <div
            key={player.id}
            className={`player-card ${
              selectedPlayers.includes(player.id!) ? 'selected' : ''
            } ${player.isLeader ? 'leader' : ''} ${
              isLeader ? 'selectable' : ''
            }`}
            onClick={() => handlePlayerSelect(player.id!)}
          >
            <div className="player-name">{player.name}</div>
            {player.isLeader && <div className="leader-badge">👑</div>}
          </div>
        ))}
      </div>

      {isLeader && (
        <button
          className="confirm-button"
          disabled={selectedPlayers.length !== requiredPlayers}
          onClick={handleConfirm}
        >
          确认队伍 ({selectedPlayers.length}/{requiredPlayers})
        </button>
      )}
    </div>
  );
};

export default TeamSelection;