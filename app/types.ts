export type Difficulty = 'easy' | 'medium' | 'hard';

export type ClueType = 'text' | 'image' | 'link';

export interface Clue {
  type: ClueType;
  content: string; // text content, image URL, or link URL
}

export interface Question {
  id: string; // format: "easy-0", "medium-2", etc.
  clues: Clue[];
  answer: string;
}

export interface GameData {
  questions: Question[];
}

export interface Team {
  id: number;
  name: string;
  score: number;
}

export interface PlaySession {
  teams: Team[];
  answeredQuestions: string[]; // question IDs that have been answered
}
