import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AnimatedCard from "../components/AnimatedCard";
import HomeTour, {
  HOME_TOUR_START_EVENT,
  markHomeTourDone,
  shouldStartHomeTour,
} from "../components/HomeTour";
import { useAuth } from "../hooks/useAuth";
import { getDashboardStats } from "../services/api";
import type { DashboardStats } from "../types/dashboard";

type ZoneTone = "board" | "locker" | "pipeline";

interface DeskZone {
  tone: ZoneTone;
  kicker: string;
  title: string;
  body: string;
  to: string;
  cta: string;
  count: number;
  unit: string;
  pulse: string;
}

function ZoneGlyph({ tone }: { tone: ZoneTone }) {
  if (tone === "board") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" className="desk-zone-glyph">
        <rect x="6" y="8" width="16" height="22" rx="2" />
        <rect x="26" y="8" width="16" height="14" rx="2" />
        <rect x="26" y="26" width="16" height="14" rx="2" />
      </svg>
    );
  }
  if (tone === "locker") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" className="desk-zone-glyph">
        <path d="M14 6h14l10 10v26H14V6z" />
        <path d="M28 6v10h10" />
        <path d="M20 24h14M20 30h14M20 36h8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="desk-zone-glyph">
      <circle cx="10" cy="24" r="5" />
      <circle cx="24" cy="24" r="5" />
      <circle cx="38" cy="24" r="5" />
      <path d="M15 24h4M29 24h4" />
    </svg>
  );
}

function buildZones(stats: DashboardStats | null): DeskZone[] {
  const jobs = stats?.job_count ?? 0;
  const cvs = stats?.cv_count ?? 0;
  const apps = stats?.application_count ?? 0;

  return [
    {
      tone: "board",
      kicker: "Board",
      title: "Pinned roles",
      body: "Every internship you care about — from LinkedIn, Kariyer.net, or a friend’s tip.",
      to: "/jobs",
      cta: jobs > 0 ? "Open Board" : "Pin your first role",
      count: jobs,
      unit: jobs === 1 ? "role" : "roles",
      pulse: jobs === 0 ? "Empty desk — start collecting" : "Keep pinning as you browse",
    },
    {
      tone: "locker",
      kicker: "Locker",
      title: "CV versions",
      body: "Company-tuned PDFs ready to match when you apply — not a one-and-done upload.",
      to: "/cvs",
      cta: cvs > 0 ? "Open locker" : "Upload a CV",
      count: cvs,
      unit: cvs === 1 ? "version" : "versions",
      pulse: cvs === 0 ? "Add a PDF to unlock matching" : "Swap versions per company anytime",
    },
    {
      tone: "pipeline",
      kicker: "Pipeline",
      title: "Applications",
      body: "Job + CV links, notes, and written answers — the living track of your season.",
      to: "/applications",
      cta: apps > 0 ? "Open Pipeline" : "Link an application",
      count: apps,
      unit: apps === 1 ? "file" : "files",
      pulse:
        apps === 0
          ? "Connect a role and a CV when ready"
          : `${stats?.interview_count ?? 0} interview · ${stats?.offer_count ?? 0} offer`,
    },
  ];
}

function momentumLine(stats: DashboardStats | null, loading: boolean): string {
  if (loading || !stats) {
    return "Loading your desk…";
  }

  const parts = [
    `${stats.job_count} pinned`,
    `${stats.cv_count} in locker`,
    `${stats.application_count} in pipeline`,
  ];

  if (stats.application_count > 0) {
    parts.push(`furthest: ${stats.furthest_pipeline_stage}`);
  }

  return parts.join(" · ");
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tourOpen, setTourOpen] = useState(false);

  const loadStats = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const statsData = await getDashboardStats(token);
      setStats(statsData);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!loading && shouldStartHomeTour()) {
      const timer = window.setTimeout(() => setTourOpen(true), 450);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [loading]);

  useEffect(() => {
    const startTour = () => setTourOpen(true);
    window.addEventListener(HOME_TOUR_START_EVENT, startTour);
    return () => window.removeEventListener(HOME_TOUR_START_EVENT, startTour);
  }, []);

  const zones = buildZones(stats);
  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  return (
    <section className="page-section home-desk">
      <div className="page-hero page-hero--animated home-desk-hero">
        <p className="page-kicker">Internship desk</p>
        <h1>
          Hey {firstName} — this is your <em>home base</em>
        </h1>
        <p className="page-description">
          Board, locker, and pipeline stay open all season. Numbers grow as you hunt — nothing
          “finishes” after one pin.
        </p>
      </div>

      <AnimatedCard delay={0}>
        <div className="home-momentum" aria-live="polite">
          <div className="home-momentum-orb" aria-hidden="true" />
          <div className="home-momentum-copy">
            <p className="home-momentum-label">Live desk</p>
            <p className="home-momentum-line">{momentumLine(stats, loading)}</p>
          </div>
          <div className="home-momentum-pills" aria-label="Quick counts">
            <span className="home-pill home-pill--mustard">
              {loading ? "…" : (stats?.interview_count ?? 0)} interviews
            </span>
            <span className="home-pill home-pill--sky">
              {loading ? "…" : (stats?.offer_count ?? 0)} offers
            </span>
          </div>
        </div>
      </AnimatedCard>

      <ol className="desk-map" aria-label="Your InternRoute desk">
        {zones.map((zone, index) => (
          <li key={zone.tone} className="desk-map-item">
            <AnimatedCard delay={80 + index * 100} className="desk-zone-wrap">
              <article
                className={`desk-zone desk-zone--${zone.tone}`}
                data-tour={`desk-${zone.tone}`}
              >
                <div className="desk-zone-top">
                  <span className="desk-zone-icon" aria-hidden="true">
                    <ZoneGlyph tone={zone.tone} />
                  </span>
                  <p className="desk-zone-kicker">
                    {String(index + 1).padStart(2, "0")} · {zone.kicker}
                  </p>
                </div>
                <h2>{zone.title}</h2>
                <p className="desk-zone-count">
                  <span className="desk-zone-number">{loading ? "…" : zone.count}</span>
                  <span className="desk-zone-unit">{zone.unit}</span>
                </p>
                <p className="desk-zone-body">{zone.body}</p>
                <p className="desk-zone-pulse">{zone.pulse}</p>
                <Link to={zone.to} className="desk-zone-cta">
                  {zone.cta}
                  <span aria-hidden="true"> →</span>
                </Link>
              </article>
            </AnimatedCard>

            {index < zones.length - 1 ? (
              <div className="desk-flow-connector" aria-hidden="true">
                <svg className="desk-flow-chevron" viewBox="0 0 40 56" fill="none">
                  <path
                    d="M8 8c10 10 18 18 24 20C26 30 18 38 8 48"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="32" cy="28" r="3.2" fill="currentColor" />
                </svg>
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      <AnimatedCard delay={320}>
        <aside className="home-sprint3-note home-sprint3-note--wide">
          <p className="page-kicker">Coming Sprint 3</p>
          <p>
            Analyzer, cover letters, and mock interviews will pull from this desk — the more you
            pin, upload, and track, the smarter those tools get.
          </p>
        </aside>
      </AnimatedCard>

      <HomeTour
        active={tourOpen}
        onFinish={() => {
          markHomeTourDone();
          setTourOpen(false);
        }}
      />
    </section>
  );
}
