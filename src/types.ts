export interface Problem {
  num1: number;
  num2: number;
  answer: number;
}

export interface GameState {
  score: number;
  lives: number;
  level: number;
  currentProblem: Problem | null;
  correctCount: number;
  totalAttempts: number;
  levelCorrectCount: number;
  streak: number;
}

export interface GameSession {
  startTime: number;
  endTime: number;
  score: number;
  accuracy: number;
  problemsAttempted: number;
  level: number;
  date: string;
}

export interface PlayerProgress {
  totalGames: number;
  avgAccuracy: number;
  bestScore: number;
  recentSessions: GameSession[];
}
