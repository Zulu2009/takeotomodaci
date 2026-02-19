import { ContentSections } from "@/components/content-sections";
import { TutorChat } from "@/components/tutor-chat";
import { getGames, getLessons, getVideos } from "@/lib/content";

export default function HomePage() {
  const lessons = getLessons();
  const games = getGames();
  const videos = getVideos();

  return (
    <main>
      <header className="card" style={{ marginBottom: "1rem" }}>
        <p className="badge">Cloudflare + Firebase + OpenAI</p>
        <h1>Sensei Suki Scaffold</h1>
        <p>
          This scaffold is ready for 10-user private rollout, with plugin-style games and R2-hosted videos.
        </p>
      </header>

      <TutorChat />
      <ContentSections lessons={lessons} games={games} videos={videos} />
    </main>
  );
}
