import LeagueInsights from "./LeagueInsights";
import SportsArchive from "./SportsArchive";

export default function Home() {
  return (
    <main>
      <header>
        <div>
          <span className="eyebrow">RAPSOMETTEDY LABS • MATCH IQ</span>
          <h1>Sports Records Lab</h1>
          <p>Independent, offline-first archives for completed sports results and historical statistics. Check each record's source before relying on it.</p>
        </div>
      </header>
      <div className="status">● Local archive active • No paid API • No bookmaker or wagering features</div>
      <SportsArchive />
      <LeagueInsights />
      <footer>Rapsometeddy MATCH IQ • Separate sports datasets • Historical records only</footer>
    </main>
  );
}
