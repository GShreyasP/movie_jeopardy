import { GameData, Question, Difficulty, PlaySession, Team } from '../types';

const STORAGE_KEY = 'movie-jeopardy-game-data';
const PLAY_SESSION_KEY = 'movie-jeopardy-play-session';

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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert('Storage quota exceeded! Please reduce image sizes or clear some questions. Images are stored as base64 which can be very large.');
      throw error;
    }
    throw error;
  }
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

export function getPlaySession(): PlaySession | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(PLAY_SESSION_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function savePlaySession(session: PlaySession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PLAY_SESSION_KEY, JSON.stringify(session));
}

export function initializePlaySession(numberOfTeams: number): PlaySession {
  const teams: Team[] = Array.from({ length: numberOfTeams }, (_, i) => ({
    id: i + 1,
    name: `Team ${i + 1}`,
    score: 0,
  }));
  
  const session: PlaySession = {
    teams,
    answeredQuestions: [],
  };
  
  savePlaySession(session);
  return session;
}

export function updateTeamScore(teamId: number, scoreChange: number): void {
  const session = getPlaySession();
  if (!session) return;
  
  const team = session.teams.find(t => t.id === teamId);
  if (team) {
    team.score += scoreChange;
    savePlaySession(session);
  }
}

export function markQuestionAnswered(questionId: string): void {
  const session = getPlaySession();
  if (!session) return;
  
  if (!session.answeredQuestions.includes(questionId)) {
    session.answeredQuestions.push(questionId);
    savePlaySession(session);
  }
}

export function clearGameData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
