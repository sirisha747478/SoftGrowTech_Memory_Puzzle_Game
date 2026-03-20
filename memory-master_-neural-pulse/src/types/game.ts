export type GameState = 'menu' | 'playing' | 'paused' | 'won' | 'lost' | 'profile' | 'leaderboard';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';
export type Theme = 'icons' | 'animals' | 'emojis' | 'abstract';
export type CardStatus = 'hidden' | 'flipped' | 'matched' | 'hint';
export type GameMode = 'classic' | 'time-attack' | 'zen' | 'endless';

export interface Card {
  id: number;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface ScoreEntry {
  id?: string;
  userId?: string;
  playerName: string;
  score: number;
  difficulty: Difficulty;
  mode: GameMode;
  theme: Theme;
  moves: number;
  date: any; // Firestore Timestamp
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  unlockedAt?: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  stats: {
    gamesPlayed: number;
    wins: number;
    bestScore: number;
    totalMoves: number;
    totalTime: number;
  };
  achievements: Achievement[]; // Changed to Achievement objects for UI
  createdAt: any;
}

export interface GridConfig {
  rows: number;
  cols: number;
  timeLimit: number;
  hints: number;
}
