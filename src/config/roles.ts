import { PlayerRole, RoleInfo, Team } from '../types/game';

export const ROLE_CONFIG: Record<PlayerRole, RoleInfo> = {
  Merlin: {
    role: 'Merlin',
    team: 'GOOD',
    canSeeEvil: true,
    specialAbility: 'Can see all evil players except Mordred'
  },
  Assassin: {
    role: 'Assassin',
    team: 'EVIL',
    canSeeEvil: true,
    specialAbility: 'Can attempt to assassinate Merlin at the end'
  },
  Percival: {
    role: 'Percival',
    team: 'GOOD',
    canSeeEvil: false,
    specialAbility: 'Can see Merlin and Morgana'
  },
  Morgana: {
    role: 'Morgana',
    team: 'EVIL',
    canSeeEvil: true,
    specialAbility: 'Appears as Merlin to Percival'
  },
  Mordred: {
    role: 'Mordred',
    team: 'EVIL',
    canSeeEvil: true,
    specialAbility: 'Hidden from Merlin'
  },
  Oberon: {
    role: 'Oberon',
    team: 'EVIL',
    canSeeEvil: false,
    specialAbility: 'Cannot be seen by other evil players'
  },
  LoyalServant: {
    role: 'LoyalServant',
    team: 'GOOD',
    canSeeEvil: false
  },
  EvilServant: {
    role: 'EvilServant',
    team: 'EVIL',
    canSeeEvil: true
  }
};

export const PLAYER_COUNT_CONFIG: Record<number, PlayerRole[]> = {
  5: ['Merlin', 'Assassin', 'LoyalServant', 'LoyalServant', 'EvilServant'],
  6: ['Merlin', 'Assassin', 'LoyalServant', 'LoyalServant', 'LoyalServant', 'EvilServant'],
  7: ['Merlin', 'Assassin', 'Percival', 'Morgana', 'LoyalServant', 'LoyalServant', 'EvilServant'],
  8: ['Merlin', 'Assassin', 'Percival', 'Morgana', 'LoyalServant', 'LoyalServant', 'EvilServant', 'EvilServant'],
  9: ['Merlin', 'Assassin', 'Percival', 'Morgana', 'Mordred', 'LoyalServant', 'LoyalServant', 'LoyalServant', 'EvilServant'],
  10: ['Merlin', 'Assassin', 'Percival', 'Morgana', 'Mordred', 'Oberon', 'LoyalServant', 'LoyalServant', 'LoyalServant', 'EvilServant']
};

export const MISSION_REQUIREMENTS: Record<number, number[]> = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5]
};