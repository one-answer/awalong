import React from 'react';
import { Player } from '../types/game';

interface PlayerListProps {
  players: Partial<Player>[];
  currentPlayerId: string;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, currentPlayerId }) => {
  return (
    <div className="player-list">
      {players.map(player => (
        <div 
          key={player.id}
          className={`player-card ${player.id === currentPlayerId ? 'current' : ''}`}
        >
          <div className="player-name">{player.name}</div>
          {player.role && <div className="player-role">{player.role}</div>}
          {player.isLeader && <div className="leader-badge">👑</div>}
        </div>
      ))}
    </div>
  );
};

export default PlayerList;