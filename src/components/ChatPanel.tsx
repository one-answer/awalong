import React, { useState, useRef, useEffect } from 'react';
import { Player } from '../types/game';
import '../styles/ChatPanel.css';

interface Message {
  id: string;
  playerId: string;
  playerName: string;
  content: string;
  timestamp: number;
}

interface ChatPanelProps {
  currentPlayer: Player;
  messages: Message[];
  onSendMessage: (content: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  currentPlayer,
  messages,
  onSendMessage
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="chat-panel">
      <div className="messages-container">
        {messages.map(message => (
          <div
            key={message.id}
            className={`message ${message.playerId === currentPlayer.id ? 'own' : ''}`}
          >
            <div className="message-header">
              <span className="player-name">{message.playerName}</span>
              <span className="timestamp">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="message-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="输入消息..."
          maxLength={200}
        />
        <button type="submit" disabled={!input.trim()}>
          发送
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;