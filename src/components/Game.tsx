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
  const [playerName, setPlayerName] = useState('');

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
    setGameState({ 
      phase: 'WAITING',
      players: [player],
      winner: null as 'GOOD' | 'EVIL' | null,
      currentRound: 1,
      missionResults: [],
      gameId: socketManager.getGameId(),
      currentMission: 0,
      missionHistory: [],
      teamProposals: [],
      votingHistory: [],
      consecutiveVoteFailures: 0
    });
    soundManager.play('join');
  };

  const renderGameContent = () => {
    if (!currentPlayer) {
      return (
        <div className="game-welcome">
          <h1>欢迎来到阿瓦隆</h1>
          <div className="join-form">
            <input
              type="text"
              placeholder="输入你的名字"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <button 
              className="join-button"
              onClick={() => {
                if (!playerName.trim()) {
                  alert('请输入名字');
                  return;
                }
                const roomId = prompt('请输入房间号，或留空创建新房间');
                const player: Player = {
                  id: Math.random().toString(36).substr(2, 9),
                  name: playerName.trim(),
                };
                if (roomId) {
                  socketManager.joinRoom(roomId);
                }
                handleJoinGame(player);
              }}
            >
              加入游戏
            </button>
          </div>
          <p className="hint">创建新房间或输入房间号加入已有游戏</p>
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