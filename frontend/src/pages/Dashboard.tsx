import { useCallback, useEffect, useState } from "react";

import AnimatedCard from "../components/AnimatedCard";
import PipelineStrip from "../components/PipelineStrip";
import { useAuth } from "../hooks/useAuth";
import { listJobs } from "../services/api";
import { getFurthestPipelineStage } from "../utils/jobStatus";

export default function DashboardPage() {
  const { token } = useAuth();
  const [jobCount, setJobCount] = useState(0);
  const [pipelineStage, setPipelineStage] = useState<
    "saved" | "applied" | "interview" | "offer"
  >("saved");

  const loadStats = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const jobs = await listJobs(token);
      setJobCount(jobs.length);
      setPipelineStage(getFurthestPipelineStage(jobs.map((job) => job.status)));
    } catch {
      setJobCount(0);
      setPipelineStage("saved");
    }
  }, [token]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return (
    <section className="page-section">
      <div className="page-hero page-hero--animated">
        <p className="page-kicker">Sprint 1 · Your hub</p>
        <h1>
          Your internship <em>command desk</em>
        </h1>
        <p className="page-description">
          One place for listings, CV versions, and interview prep — no more scattered spreadsheets.
        </p>
      </div>

      <PipelineStrip activeStage={pipelineStage} />

      <div className="dashboard-grid">
        <AnimatedCard delay={0}>
          <article className="stat-card stat-card--float">
            <h2>Applications</h2>
            <p className="stat-value">{jobCount}</p>
            <p className="stat-label">Pinned roles on your board</p>
          </article>
        </AnimatedCard>
        <AnimatedCard delay={80}>
          <article className="stat-card stat-card--float">
            <h2>CV Versions</h2>
            <p className="stat-value">0</p>
            <p className="stat-label">Upload a CV for every role — Sprint 2</p>
          </article>
        </AnimatedCard>
        <AnimatedCard delay={160}>
          <article className="stat-card stat-card--float">
            <h2>AI Sessions</h2>
            <p className="stat-value">0</p>
            <p className="stat-label">Mock interviews & cover letters — Sprint 3</p>
          </article>
        </AnimatedCard>
      </div>
    </section>
  );
}
