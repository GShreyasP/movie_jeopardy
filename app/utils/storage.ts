import { GameData, Question } from '../types';

const STORAGE_KEY = 'movie-jeopardy-game-data';

export function getGameData(): GameData {
  if (typeof window === 'undefined') {
    return { questions: [] };
  }
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { questions: [] };
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return { questions: [] };
  }
}

export function saveGameData(data: GameData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getQuestion(id: string): Question | null {
  const gameData = getGameData();
  return gameData.questions.find(q => q.id === id) || null;
}

export function saveQuestion(question: Question): void {
  const gameData = getGameData();
  const existingIndex = gameData.questions.findIndex(q => q.id === question.id);
  
  if (existingIndex >= 0) {
    gameData.questions[existingIndex] = question;
  } else {
    gameData.questions.push(question);
  }
  
  saveGameData(gameData);
}

export function generateQuestionId(difficulty: Difficulty, column: number): string {
  return `${difficulty}-${column}`;
}
