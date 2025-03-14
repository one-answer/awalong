import React from 'react';
import '../styles/MissionBoard.css';

interface MissionBoardProps {
  currentMission: number;
  missionHistory: boolean[];
  playerCount: number;
  requiredPlayers: number[];
}

const MissionBoard: React.FC<MissionBoardProps> = ({
  currentMission,
  missionHistory,
  playerCount,
  requiredPlayers,
}) => {
  return (
    <div className="mission-board">
      <h2>任务面板</h2>
      <div className="missions">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`mission ${
              index === currentMission ? 'current' : ''
            } ${
              missionHistory[index] !== undefined
                ? missionHistory[index]
                  ? 'success'
                  : 'fail'
                : ''
            }`}
          >
            <div className="mission-number">{index + 1}</div>
            <div className="required-players">
              {requiredPlayers[index]}人
              {index === 3 && playerCount >= 7 && (
                <span className="special-rule">需2次失败</span>
              )}
            </div>
            {missionHistory[index] !== undefined && (
              <div className="mission-result">
                {missionHistory[index] ? '✓' : '✗'}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mission-summary">
        <div className="success-count">
          成功: {missionHistory.filter(result => result).length}/3
        </div>
        <div className="fail-count">
          失败: {missionHistory.filter(result => !result).length}/3
        </div>
      </div>
    </div>
  );
};

export default MissionBoard;