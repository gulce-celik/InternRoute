import { useCallback, useEffect, useState } from "react";

import AnimatedCard from "../components/AnimatedCard";
import PipelineStrip from "../components/PipelineStrip";
import { useAuth } from "../hooks/useAuth";
import { getDashboardStats } from "../services/api";
import type { DashboardStats } from "../types/dashboard";

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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

  const pipelineStage = stats?.furthest_pipeline_stage ?? "saved";

  return (
    <section className="page-section">
      <div className="page-hero page-hero--animated">
        <p className="page-kicker">Sprint 2 · Your hub</p>
        <h1>
          Your internship <em>command desk</em>
        </h1>
        <p className="page-description">
          One place for listings, CV versions, and application matches — no more scattered
          spreadsheets.
        </p>
      </div>

      <PipelineStrip activeStage={pipelineStage} />

      <div className="dashboard-grid">
        <AnimatedCard delay={0}>
          <article className="stat-card stat-card--float">
            <h2>Applications</h2>
            <p className="stat-value">{loading ? "…" : (stats?.application_count ?? 0)}</p>
            <p className="stat-label">
              {stats?.job_count ?? 0} pinned roles · {stats?.interview_count ?? 0} interviews
            </p>
          </article>
        </AnimatedCard>
        <AnimatedCard delay={80}>
          <article className="stat-card stat-card--float">
            <h2>CV Versions</h2>
            <p className="stat-value">{loading ? "…" : (stats?.cv_count ?? 0)}</p>
            <p className="stat-label">Ready in your locker for Pipeline matching</p>
          </article>
        </AnimatedCard>
        <AnimatedCard delay={160}>
          <article className="stat-card stat-card--float">
            <h2>Offers</h2>
            <p className="stat-value">{loading ? "…" : (stats?.offer_count ?? 0)}</p>
            <p className="stat-label">Mock interviews & cover letters — Sprint 3</p>
          </article>
        </AnimatedCard>
      </div>
    </section>
  );
}
