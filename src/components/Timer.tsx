import React, { useState, useEffect } from 'react';
import '../styles/Timer.css';

interface TimerProps {
  duration: number;  // 以秒为单位
  onTimeout: () => void;
  isActive: boolean;
}

const Timer: React.FC<TimerProps> = ({ duration, onTimeout, isActive }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, onTimeout]);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={`timer ${timeLeft < 10 ? 'warning' : ''}`}>
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};

export default Timer;