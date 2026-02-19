import games from "../../../content/seed/games.json";
import lessons from "../../../content/seed/lessons.json";
import videos from "../../../content/seed/videos.json";
import type { LearningGame, Lesson, VideoLesson } from "./types";

export function getLessons(): Lesson[] {
  return lessons as Lesson[];
}

export function getGames(): LearningGame[] {
  return games as LearningGame[];
}

export function getVideos(): VideoLesson[] {
  return videos as VideoLesson[];
}
