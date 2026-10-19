export type GameMode =
  | 'welcome'
  | 'menu'
  | 'local'
  | 'online_lobby'
  | 'online_room'
  | 'playing'
  | 'settings'
  | 'how_to_play';

export interface Player {
  id: string;
  name: string;
  isHost?: boolean;
  isReady?: boolean;
  score: number;
  rematchRequested?: boolean;
}

export interface MatchState {
  code?: string;
  status: 'waiting' | 'ready' | 'countdown' | 'playing' | 'game_over';
  players: Player[];
  currentTurnPlayerId: string | null;
  waterLevel: number; // 0 to 100
  isTapOpen: boolean;
  flowRate: number;
  isOverflowed: boolean;
  winnerPlayerId: string | null;
  loserPlayerId: string | null;
  winnerName?: string;
  loserName?: string;
  roundNumber: number;
  countdown: number | null;
}

export interface SoundSettings {
  masterMute: boolean;
  musicVolume: number; // 0 to 1
  sfxVolume: number;   // 0 to 1
}

export type GraphicQuality = 'low' | 'medium' | 'high';

export interface OpenRoomSummary {
  code: string;
  hostName: string;
  createdAt: number;
}
