export type LessonDay =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20
  | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30;

export const LESSON_PROMPTS: Record<LessonDay, string> = {
  1: "Greetings and self-introduction",
  2: "Numbers 1-20",
  3: "Family words",
  4: "School classroom words",
  5: "Days of week",
  6: "Food basics",
  7: "Polite requests",
  8: "Simple present tense",
  9: "Time and schedules",
  10: "Shopping basics",
  11: "Directions and places",
  12: "Transportation",
  13: "Weather and seasons",
  14: "Hobbies and preferences",
  15: "Animals and nature",
  16: "Body and health basics",
  17: "Home and rooms",
  18: "Colors and shapes",
  19: "Activities and verbs",
  20: "Question forms",
  21: "Past tense basics",
  22: "Future intentions",
  23: "Comparisons",
  24: "Giving reasons",
  25: "Casual vs polite speech",
  26: "Storytelling basics",
  27: "Reading short dialogues",
  28: "Listening practice style prompts",
  29: "Review weak vocabulary",
  30: "Comprehensive review day"
};
