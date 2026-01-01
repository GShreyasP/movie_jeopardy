export type Difficulty = 'easy' | 'medium' | 'hard';

export type ClueType = 'text' | 'image' | 'link';

export interface Clue {
  type: ClueType;
  content: string; // text content, image URL, or link URL
  isClip?: boolean; // true if the link is a YouTube clip
}

export interface Question {
  id: string; // format: "easy-0", "medium-2", etc.
  initialClue?: Clue; // The initial clue shown automatically
  clues: Clue[]; // Additional clues (up to 3)
  answer: string;
  moviePoster?: string; // URL or base64 image
  movieName?: string;
  youtubeVideo?: string; // YouTube URL or video ID
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
