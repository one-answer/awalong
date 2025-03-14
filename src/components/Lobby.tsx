import React from 'react';
import { GameState, Player } from '../types/game';
import '../styles/Lobby.css';

interface LobbyProps {
  gameState: GameState;
  currentPlayer: Player;
  onStartGame: () => void;
  onJoinGame: (player: Player) => void;
}

const Lobby: React.FC<LobbyProps> = ({
  gameState,
  currentPlayer,
  onStartGame,
  onJoinGame
}) => {
  const canStartGame = gameState.players.length >= 5 && gameState.players.length <= 10;
  const isHost = gameState.players[0]?.id === currentPlayer.id;

  return (
    <div className="lobby">
      <h2>游戏大厅</h2>
      <div className="room-info">
        <p>房间号: {gameState.gameId}</p>
        <p>玩家数量: {gameState.players.length}/10</p>
      </div>
      <div className="players-list">
        {gameState.players.map(player => (
          <div key={player.id} className="player-item">
            {player.name} {player.id === currentPlayer.id && '(你)'}
          </div>
        ))}
      </div>
      {isHost && (
        <button 
          className={`start-button ${!canStartGame ? 'disabled' : ''}`}
          onClick={onStartGame}
          disabled={!canStartGame}
        >
          开始游戏
          {!canStartGame && ' (需要5-10名玩家)'}
        </button>
      )}
    </div>
  );
};

export default Lobby;