import React, { useState } from 'react';
import { Player } from '../types/game';
import '../styles/VotingPanel.css';

interface VotingPanelProps {
  type: 'team' | 'mission';
  currentPlayer: Partial<Player>;
  teamMembers: Partial<Player>[];
  onVote: (approve: boolean) => void;
  votingHistory?: { playerId: string; approve: boolean; }[];
  consecutiveFailures?: number;
}

const VotingPanel: React.FC<VotingPanelProps> = ({
  type,
  currentPlayer,
  teamMembers,
  onVote,
  votingHistory = [],
  consecutiveFailures = 0
}) => {
  const [hasVoted, setHasVoted] = useState(false);
  const isTeamMember = teamMembers.some(p => p.id === currentPlayer.id);
  const hasPlayerVoted = votingHistory.some(v => v.playerId === currentPlayer.id);

  const handleVote = (approve: boolean) => {
    if (!hasVoted && !hasPlayerVoted) {
      onVote(approve);
      setHasVoted(true);
    }
  };

  return (
    <div className="voting-panel">
      <h2>{type === 'team' ? '队伍投票' : '任务投票'}</h2>
      
      {type === 'team' && (
        <div className="team-info">
          <h3>提议的队伍</h3>
          <div className="team-members">
            {teamMembers.map(player => (
              <div key={player.id} className="team-member">
                {player.name}
                {player.isLeader && <span className="leader-badge">👑</span>}
              </div>
            ))}
          </div>
          {consecutiveFailures > 0 && (
            <div className="failure-warning">
              连续投票失败: {consecutiveFailures}/5
            </div>
          )}
        </div>
      )}

      {type === 'mission' && !isTeamMember && (
        <div className="spectator-message">
          等待任务队员执行任务...
        </div>
      )}

      {(!hasVoted && !hasPlayerVoted) && (
        type === 'team' || (type === 'mission' && isTeamMember)
      ) ? (
        <div className="voting-buttons">
          <button
            className="approve-button"
            onClick={() => handleVote(true)}
          >
            {type === 'team' ? '同意' : '任务成功'}
          </button>
          <button
            className="reject-button"
            onClick={() => handleVote(false)}
            disabled={type === 'mission' && currentPlayer.team === 'GOOD'}
          >
            {type === 'team' ? '反对' : '任务失败'}
          </button>
        </div>
      ) : (
        <div className="vote-complete">
          {hasPlayerVoted || hasVoted ? '已完成投票' : '等待其他玩家...'}
        </div>
      )}

      {type === 'team' && (
        <div className="voting-progress">
          已投票: {votingHistory.length}/{teamMembers.length}
        </div>
      )}
    </div>
  );
};

export default VotingPanel;