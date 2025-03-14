import React, { useState, useEffect } from 'react';
import { GameState, Player } from '../types/game';
import { SocketManager } from '../utils/socketManager';
import { MISSION_REQUIREMENTS } from '../config/roles';
import Lobby from './Lobby';
import MissionBoard from './MissionBoard';
import TeamSelection from './TeamSelection';
import VotingPanel from './VotingPanel';
import GameOver from './GameOver';
import '../styles/Game.css';
import { SoundManager } from '../utils/soundManager';
import '../styles/animations.css';
import RulesGuide from './RulesGuide';
import ChatPanel from './ChatPanel';
import Timer from './Timer';
import { Message } from '../types/message';
import AssassinationPhase from './AssassinationPhase';

const Game: React.FC = () => {
  const [socketManager] = useState(() => 
    new SocketManager(Math.random().toString(36).substr(2, 9))
  );
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [assassinationTarget, setAssassinationTarget] = useState<Player | null>(null);
  const [soundManager] = useState(() => new SoundManager());
  const [showRules, setShowRules] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    socketManager.connect((newState: GameState) => {
      setGameState(newState);
    });

    socketManager.onMessage((message: Message) => {
      setMessages(prev => [...prev, message]);
      soundManager.play('message');
    });

    return () => {
      socketManager.disconnect();
    };
  }, [socketManager]);

  const handleSendMessage = (content: string) => {
    if (currentPlayer) {
      socketManager.sendMessage(content);
    }
  };

  const handleJoinGame = (player: Player) => {
    socketManager.addPlayer(player);
    setCurrentPlayer(player);
    soundManager.play('join');
  };

  const handleStartGame = () => {
    socketManager.startGame();
  };

  const handleTeamProposal = (selectedPlayers: string[]) => {
    if (currentPlayer) {
      socketManager.proposeTeam(currentPlayer.id, selectedPlayers);
    }
  };

  const handleTeamVote = (approve: boolean) => {
    if (currentPlayer) {
      socketManager.submitTeamVote(currentPlayer.id, approve);
      soundManager.play('vote');
    }
  };

  const handleMissionVote = (success: boolean) => {
    if (currentPlayer) {
      socketManager.submitMissionVote(currentPlayer.id, success);
      soundManager.play(success ? 'success' : 'fail');
    }
  };

  const handleAssassination = (targetId: string) => {
    if (currentPlayer) {
      socketManager.submitAssassination(currentPlayer.id, targetId);
      soundManager.play('reveal');
    }
  };

  const getTimerDuration = () => {
    switch (gameState?.phase) {
      case 'TEAM_BUILDING':
        return 120; // 2分钟选择队伍
      case 'TEAM_VOTE':
        return 60;  // 1分钟投票时间
      case 'MISSION':
        return 60;  // 1分钟任务时间
      case 'ASSASSINATE':
        return 180; // 3分钟刺杀时间
      default:
        return 0;
    }
  };

  const handleTimeout = () => {
    if (!gameState || !currentPlayer) return;

    switch (gameState.phase) {
      case 'TEAM_BUILDING':
        // 自动选择前N个玩家
        const requiredCount = MISSION_REQUIREMENTS[gameState.players.length][gameState.currentMission];
        const autoTeam = gameState.players.slice(0, requiredCount).map(p => p.id);
        handleTeamProposal(autoTeam);
        break;
      case 'TEAM_VOTE':
        // 超时自动投反对票
        handleTeamVote(false);
        break;
      case 'MISSION':
        // 超时自动投成功票
        handleMissionVote(true);
        break;
      case 'ASSASSINATE':
        // 超时随机选择一个目标
        const goodPlayers = gameState.players.filter(p => p.team === 'GOOD');
        const randomTarget = goodPlayers[Math.floor(Math.random() * goodPlayers.length)];
        handleAssassination(randomTarget.id);
        break;
    }
  };

  const renderGameContent = () => {
    if (!gameState) {
      return (
        <div className="game-welcome">
          <h1>欢迎来到 Avalon</h1>
          <div className="join-form">
            <input
              type="text"
              placeholder="输入你的名字"
              onChange={(e) => {
                const player: Player = {
                  id: Math.random().toString(36).substr(2, 9),
                  name: e.target.value
                };
                handleJoinGame(player);
              }}
            />
          </div>
        </div>
      );
    }

    const showTimer = ['TEAM_BUILDING', 'TEAM_VOTE', 'MISSION', 'ASSASSINATE'].includes(gameState.phase);

    return (
      <div className="game-phase">
        {showTimer && (
          <Timer
            duration={getTimerDuration()}
            onTimeout={handleTimeout}
            isActive={true}
          />
        )}
        {renderPhaseContent()}
      </div>
    );
  };

  const renderPhaseContent = () => {
    if (!gameState) return null;

    const visiblePlayers = gameState.players.map(p => ({
      id: p.id,
      name: p.name,
      isLeader: p.isLeader,
      revealed: p.revealed,
      ...(p.id === currentPlayer?.id ? { role: p.role, team: p.team } : {})
    }));

    switch (gameState.phase) {
      case 'WAITING':
        return (
          <Lobby
            gameState={gameState}
            currentPlayer={currentPlayer!}
            onStartGame={handleStartGame}
            onJoinGame={handleJoinGame}
          />
        );

      case 'TEAM_BUILDING':
        return (
          <>
            <MissionBoard
              currentMission={gameState.currentMission}
              missionHistory={gameState.missionHistory}
              playerCount={gameState.players.length}
              requiredPlayers={MISSION_REQUIREMENTS[gameState.players.length]}
            />
            <TeamSelection
              players={visiblePlayers}
              currentPlayerId={currentPlayer!.id}
              requiredPlayers={MISSION_REQUIREMENTS[gameState.players.length][gameState.currentMission]}
              onTeamConfirm={handleTeamProposal}
            />
          </>
        );

      case 'TEAM_VOTE':
        return (
          <>
            <MissionBoard
              currentMission={gameState.currentMission}
              missionHistory={gameState.missionHistory}
              playerCount={gameState.players.length}
              requiredPlayers={MISSION_REQUIREMENTS[gameState.players.length]}
            />
            <VotingPanel
              type="team"
              currentPlayer={currentPlayer!}
              teamMembers={gameState.teamProposals}
              onVote={handleTeamVote}
              votingHistory={gameState.votingHistory}
              consecutiveFailures={gameState.consecutiveVoteFailures}
            />
          </>
        );

      case 'MISSION':
        return (
          <>
            <MissionBoard
              currentMission={gameState.currentMission}
              missionHistory={gameState.missionHistory}
              playerCount={gameState.players.length}
              requiredPlayers={MISSION_REQUIREMENTS[gameState.players.length]}
            />
            <VotingPanel
              type="mission"
              currentPlayer={currentPlayer!}
              teamMembers={gameState.teamProposals}
              onVote={handleMissionVote}
            />
          </>
        );

      case 'ASSASSINATE':
        return (
          <AssassinationPhase
            players={gameState.players}
            onAssassinate={handleAssassination}
          />
        );

      case 'GAME_OVER':
        return (
          <GameOver
            players={gameState.players}
            winningTeam={gameState.winner!}
            missionHistory={gameState.missionHistory}
            assassinationTarget={assassinationTarget!}
          />
        );

      default:
        return <div>游戏进行中...</div>;
    }
  };

  return (
    <div className="game">
      <div className="game-header">
        <button 
          className="rules-button"
          onClick={() => setShowRules(true)}
        >
          查看规则
        </button>
      </div>
      <div className="game-content">
        {renderGameContent()}
        {currentPlayer && (
          <ChatPanel
            currentPlayer={currentPlayer}
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
      {showRules && <RulesGuide onClose={() => setShowRules(false)} />}
    </div>
  );
};

export default Game;