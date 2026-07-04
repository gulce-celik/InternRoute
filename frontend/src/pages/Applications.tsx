import { useCallback, useEffect, useState } from "react";

import AnimatedCard from "../components/AnimatedCard";
import PipelineStrip from "../components/PipelineStrip";
import { useAuth } from "../hooks/useAuth";
import { listJobs } from "../services/api";
import type { Job } from "../types/job";
import { getFurthestPipelineStage, mapJobStatusToPipelineStage } from "../utils/jobStatus";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ApplicationsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await listJobs(token);
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  useEffect(() => {
    if (jobs.length === 0) {
      setSelectedJobId(null);
      return;
    }

    if (selectedJobId === null || !jobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? jobs[0];
  const pipelineStage = selectedJob
    ? mapJobStatusToPipelineStage(selectedJob.status)
    : getFurthestPipelineStage(jobs.map((job) => job.status));

  return (
    <section className="page-section">
      <div className="page-hero page-hero--animated">
        <p className="page-kicker">Your flow</p>
        <h1>
          Application <em>pipeline</em>
        </h1>
        <p className="page-description">
          Every role you pin on the board appears here. Click a card to see that role&apos;s stage
          in the progress bar above.
        </p>
      </div>

      {error && <p className="error banner-error">{error}</p>}

      <PipelineStrip activeStage={pipelineStage} />

      {selectedJob && jobs.length > 0 && (
        <p className="pipeline-focus-label">
          Showing pipeline for <strong>{selectedJob.title}</strong>
          <span className="pipeline-focus-meta"> · {selectedJob.company}</span>
        </p>
      )}

      {loading ? (
        <p className="muted">Loading your pipeline...</p>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <strong>No roles in your pipeline yet</strong>
          Add a listing on the Board tab — it will show up here automatically.
        </div>
      ) : (
        <div className="pipeline-preview-grid">
          {jobs.map((job, index) => {
            const isSelected = job.id === selectedJobId;

            return (
              <AnimatedCard key={job.id} delay={index * 80}>
                <article
                  className={`flow-card flow-card--drift flow-card--selectable${isSelected ? " flow-card--selected" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`Show pipeline for ${job.title} at ${job.company}`}
                  onClick={() => setSelectedJobId(job.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedJobId(job.id);
                    }
                  }}
                >
                  <span className="flow-card-pin" aria-hidden="true" />
                  <h3>{job.title}</h3>
                  <p className="job-meta">
                    {job.company}
                    {job.location ? ` · ${job.location}` : ""}
                  </p>
                  <p className="job-description">{job.description}</p>
                  <div className="flow-card-footer">
                    <span className={`status-badge status-badge--${job.status}`}>{job.status}</span>
                    <span className="job-date">
                      {mapJobStatusToPipelineStage(job.status)} · Added {formatDate(job.created_at)}
                    </span>
                  </div>
                </article>
              </AnimatedCard>
            );
          })}
        </div>
      )}
    </section>
  );
}
