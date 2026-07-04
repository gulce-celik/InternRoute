import AnimatedCard from "../components/AnimatedCard";

export default function CVsPage() {
  return (
    <section className="page-section">
      <div className="page-hero page-hero--animated">
        <p className="page-kicker">Coming in Sprint 2</p>
        <h1>
          Your CV <em>locker</em>
        </h1>
        <p className="page-description">
          Keep a version for every company — Siemens CV ≠ startup CV. Upload lands here next sprint.
        </p>
      </div>

      <AnimatedCard>
        <div className="coming-soon-card">
          <div className="coming-soon-icon coming-soon-icon--doc" aria-hidden="true" />
          <strong>PDF upload is on the way</strong>
          <p className="muted">
            Drag-and-drop CV cards with preview thumbnails — wired after the backend upload API.
          </p>
          <ul className="feature-preview-list">
            <li>Multiple versions per role</li>
            <li>Quick swap before you apply</li>
            <li>Auto-ingest to AI memory later</li>
          </ul>
        </div>
      </AnimatedCard>
    </section>
  );
}
