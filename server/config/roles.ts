import { PlayerRole } from '../types/game';

export const ROLE_CONFIG = {
  'Merlin': { team: 'GOOD' },
  'Percival': { team: 'GOOD' },
  'Loyal Servant': { team: 'GOOD' },
  'Assassin': { team: 'EVIL' },
  'Morgana': { team: 'EVIL' },
  'Mordred': { team: 'EVIL' },
  'Oberon': { team: 'EVIL' }
};

export const PLAYER_COUNT_CONFIG: { [key: number]: PlayerRole[] } = {
  5: ['Merlin', 'Percival', 'Loyal Servant', 'Assassin', 'Morgana'],
  6: ['Merlin', 'Percival', 'Loyal Servant', 'Loyal Servant', 'Assassin', 'Morgana'],
  7: ['Merlin', 'Percival', 'Loyal Servant', 'Loyal Servant', 'Assassin', 'Morgana', 'Oberon'],
  8: ['Merlin', 'Percival', 'Loyal Servant', 'Loyal Servant', 'Loyal Servant', 'Assassin', 'Morgana', 'Mordred'],
  9: ['Merlin', 'Percival', 'Loyal Servant', 'Loyal Servant', 'Loyal Servant', 'Loyal Servant', 'Assassin', 'Morgana', 'Mordred'],
  10: ['Merlin', 'Percival', 'Loyal Servant', 'Loyal Servant', 'Loyal Servant', 'Loyal Servant', 'Assassin', 'Morgana', 'Mordred', 'Oberon']
};

export const MISSION_REQUIREMENTS: { [key: number]: number[] } = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5]
};