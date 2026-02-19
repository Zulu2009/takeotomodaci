export type Lesson = {
  id: string;
  title: string;
  level: "beginner" | "intermediate";
  objective: string;
  vocab: string[];
};

export type WordfindConfig = {
  gridSize: number;
  words: string[];
  hints: string[];
};

export type VideoLesson = {
  id: string;
  title: string;
  summary: string;
  r2Key: string;
  durationMinutes: number;
};

export type LearningGame = {
  id: string;
  type: "wordfind";
  title: string;
  config: WordfindConfig;
};
