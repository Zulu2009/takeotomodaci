import type { LearningGame, Lesson, VideoLesson } from "@/lib/types";

type Props = {
  lessons: Lesson[];
  games: LearningGame[];
  videos: VideoLesson[];
};

export function ContentSections({ lessons, games, videos }: Props) {
  return (
    <>
      <section>
        <h2>Lessons</h2>
        <div className="grid">
          {lessons.map((lesson) => (
            <article key={lesson.id} className="card">
              <span className="badge">{lesson.level}</span>
              <h3>{lesson.title}</h3>
              <p>{lesson.objective}</p>
              <p>
                <strong>Vocab:</strong> {lesson.vocab.join(", ")}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Games</h2>
        <div className="grid">
          {games.map((game) => (
            <article key={game.id} className="card">
              <span className="badge">{game.type}</span>
              <h3>{game.title}</h3>
              <p>
                <strong>Grid:</strong> {game.config.gridSize}x{game.config.gridSize}
              </p>
              <p>
                <strong>Words:</strong> {game.config.words.join(", ")}
              </p>
              <button type="button" className="secondary">
                Play (UI hook)
              </button>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Videos</h2>
        <div className="grid">
          {videos.map((video) => (
            <article key={video.id} className="card">
              <h3>{video.title}</h3>
              <p>{video.summary}</p>
              <p>
                <strong>Duration:</strong> {video.durationMinutes} min
              </p>
              <p>
                <strong>R2 Key:</strong> {video.r2Key}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
