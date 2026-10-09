import LocalMatchLab from "./LocalMatchLab";
import LeagueInsights from "./LeagueInsights";

export default function Home() {
  return (
    <>
      <LocalMatchLab />
      <main className="league-insights">
        <LeagueInsights />
      </main>
    </>
  );
}
