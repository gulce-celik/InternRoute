import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import AgentHistoryPanel from "../components/AgentHistoryPanel";
import AnimatedCard from "../components/AnimatedCard";
import { FormSkeleton } from "../components/Skeleton";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../hooks/useAuth";
import { analyzeJobCv, listApplications, listCVs, listJobs } from "../services/api";
import type { AnalyzeResult } from "../types/agents";
import type { Application } from "../types/application";
import type { CV } from "../types/cv";
import type { Job } from "../types/job";
import {
  clearAnalyzeHistory,
  loadAnalyzeHistory,
  newHistoryId,
  prependAnalyzeHistory,
  removeAnalyzeHistory,
  type AnalyzeHistoryEntry,
} from "../utils/agentHistory";

function fitBadgeClass(score: number): string {
  if (score >= 75) {
    return "status-badge--offer";
  }
  if (score >= 50) {
    return "status-badge--interview";
  }
  if (score >= 30) {
    return "status-badge--applied";
  }
  return "status-badge--rejected";
}

function formatAnalyzeForCoverLetter(result: AnalyzeResult): string {
  const bullet = (items: string[]) =>
    items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- (none)";

  return [
    `Fit score: ${result.fit_score}/100`,
    "",
    "Summary:",
    result.summary.trim() || "(no summary)",
    "",
    "Strengths:",
    bullet(result.strengths),
    "",
    "Gaps:",
    bullet(result.gaps),
    "",
    "Keywords to add:",
    bullet(result.keywords_to_add),
    "",
    "Recommendations:",
    bullet(result.recommendations),
  ].join("\n");
}

function ReportList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="analyze-report-block">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <ul className="analyze-report-list">
          {items.map((item) => (
            <li key={`${title}-${item}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AnalyzePage() {
  const { token, user } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [history, setHistory] = useState<AnalyzeHistoryEntry[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const [jobId, setJobId] = useState("");
  const [cvId, setCvId] = useState("");

  useEffect(() => {
    const entries = loadAnalyzeHistory(user?.id);
    setHistory(entries);
    if (entries[0]) {
      setResult(entries[0].result);
      setActiveSessionId(entries[0].id);
    }
  }, [user?.id]);

  const loadData = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const [jobData, cvData, applicationData] = await Promise.all([
        listJobs(token),
        listCVs(token),
        listApplications(token),
      ]);
      setJobs(jobData);
      setCvs(cvData);
      setApplications(applicationData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load Analyze inputs");
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Prefill from query string (Pipeline deep links).
  useEffect(() => {
    if (loading) {
      return;
    }

    const qApp = searchParams.get("application_id");
    const qJob = searchParams.get("job_id");
    const qCv = searchParams.get("cv_id");

    if (qApp) {
      const application = applications.find((item) => String(item.id) === qApp);
      if (application) {
        setJobId(String(application.job_id));
        if (application.cv_id != null) {
          setCvId(String(application.cv_id));
        }
        return;
      }
    }

    if (qJob && jobs.some((item) => String(item.id) === qJob)) {
      setJobId(qJob);
    }
    if (qCv && cvs.some((item) => String(item.id) === qCv)) {
      setCvId(qCv);
    }
  }, [loading, searchParams, jobs, cvs, applications]);

  const selectedJob = jobs.find((job) => String(job.id) === jobId);
  const selectedCv = cvs.find((cv) => String(cv.id) === cvId);
  const canSubmit = Boolean(jobId && cvId);

  async function handleAnalyze(event: FormEvent) {
    event.preventDefault();
    if (!token || !canSubmit) {
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const data = await analyzeJobCv(token, {
        job_id: Number(jobId),
        cv_id: Number(cvId),
      });

      const entry: AnalyzeHistoryEntry = {
        id: newHistoryId(),
        createdAt: new Date().toISOString(),
        label: selectedJob ? `${selectedJob.title} · ${selectedJob.company}` : "Gap scan",
        subtitle: selectedCv?.name,
        result: data,
      };
      setHistory(prependAnalyzeHistory(user?.id, entry));
      setActiveSessionId(entry.id);
      setResult(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleSelectSession(id: string) {
    const entry = history.find((item) => item.id === id);
    if (!entry) {
      return;
    }
    setActiveSessionId(entry.id);
    setResult(entry.result);
    setCopyState("idle");
  }

  function handleRemoveSession(id: string) {
    const next = removeAnalyzeHistory(user?.id, id);
    setHistory(next);
    if (activeSessionId === id) {
      const latest = next[0] ?? null;
      setActiveSessionId(latest?.id ?? null);
      setResult(latest?.result ?? null);
    }
  }

  function handleClearSessions() {
    clearAnalyzeHistory(user?.id);
    setHistory([]);
    setActiveSessionId(null);
    setResult(null);
    setCopyState("idle");
  }

  async function handleCopyForCoverLetter() {
    if (!result) {
      return;
    }
    try {
      await navigator.clipboard.writeText(formatAnalyzeForCoverLetter(result));
      setCopyState("copied");
      toast.success("Copied — paste into Letters → Analyzer summary.");
      window.setTimeout(() => setCopyState("idle"), 2500);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }

  return (
    <section className="page-section">
      <div className="page-hero page-hero--animated">
        <p className="page-kicker">Gap scan</p>
        <h1>
          Compare a CV to a <em>pinned role</em>
        </h1>
        <p className="page-description">
          Pick a listing and a locker version. InternRoute reads job text + CV memory and returns
          strengths, gaps, and what to tighten before you apply.
        </p>
      </div>

      <div className="jobs-layout">
        <AnimatedCard>
          <article className="panel panel--form">
            <h2>Run analysis</h2>

            {loading ? (
              <FormSkeleton rows={4} />
            ) : jobs.length === 0 || cvs.length === 0 ? (
              <div className="empty-state analyze-prereq-empty">
                {jobs.length === 0 && cvs.length === 0 ? (
                  <>
                    <strong>Need a role and a CV</strong>
                    <p className="empty-state-copy">
                      Gap scan needs something on your Board and in your locker first.
                    </p>
                    <div className="analyze-prereq-actions">
                      <Link to="/jobs" className="desk-zone-cta">
                        Pin a role
                      </Link>
                      <Link to="/cvs" className="desk-zone-cta">
                        Upload a CV
                      </Link>
                    </div>
                  </>
                ) : jobs.length === 0 ? (
                  <>
                    <strong>No pinned roles yet</strong>
                    <p className="empty-state-copy">
                      Add a listing on the Board, then come back to compare it with a CV.
                    </p>
                    <div className="analyze-prereq-actions">
                      <Link to="/jobs" className="desk-zone-cta">
                        Open Board
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <strong>No CVs in your locker</strong>
                    <p className="empty-state-copy">
                      Upload a PDF first — Analyze needs a CV version to scan against the role.
                    </p>
                    <div className="analyze-prereq-actions">
                      <Link to="/cvs" className="desk-zone-cta">
                        Open locker
                      </Link>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={(event) => void handleAnalyze(event)} className="job-form">
                <label>
                  Role
                  <select
                    value={jobId}
                    onChange={(event) => setJobId(event.target.value)}
                    required
                  >
                    <option value="">Select a pinned role</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title} · {job.company}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  CV version
                  <select
                    value={cvId}
                    onChange={(event) => setCvId(event.target.value)}
                    required
                  >
                    <option value="">Select from locker</option>
                    {cvs.map((cv) => (
                      <option key={cv.id} value={cv.id}>
                        {cv.name}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedJob ? (
                  <p className="muted analyze-selection-hint">
                    {selectedJob.company}
                    {selectedCv ? ` · ${selectedCv.name}` : ""}
                  </p>
                ) : null}

                <button type="submit" disabled={!canSubmit || analyzing}>
                  {analyzing ? "Scanning..." : "Run gap scan"}
                </button>
              </form>
            )}

            <div className="analyze-sessions-block">
              <AgentHistoryPanel
                embedded
                title="Past sessions"
                emptyText="Past gap scans will show up here."
                items={history.map((entry) => ({
                  id: entry.id,
                  createdAt: entry.createdAt,
                  label: entry.label,
                  subtitle: entry.subtitle,
                  badge: `Fit ${entry.result.fit_score}`,
                }))}
                activeId={activeSessionId}
                onSelect={handleSelectSession}
                onRemove={handleRemoveSession}
                onClear={handleClearSessions}
              />
            </div>
          </article>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <div className="panel">
            <div className="letter-studio-head">
              <h2>Report</h2>
              {result && !analyzing ? (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => void handleCopyForCoverLetter()}
                >
                  {copyState === "copied" ? "Copied" : "Copy for cover letter"}
                </button>
              ) : null}
            </div>

            {analyzing ? (
              <p className="muted">Comparing the listing to your CV memory...</p>
            ) : !result ? (
              <div className="empty-state">
                <strong>No report yet</strong>
                Choose a role and CV, then run a gap scan.
              </div>
            ) : (
              <div className="analyze-report">
                <div className="analyze-report-header">
                  <div>
                    <p className="page-kicker">Fit score</p>
                    <p className="analyze-fit-score">{result.fit_score}</p>
                  </div>
                  <span className={`status-badge ${fitBadgeClass(result.fit_score)}`}>
                    {result.fit_score >= 75
                      ? "strong"
                      : result.fit_score >= 50
                        ? "solid"
                        : result.fit_score >= 30
                          ? "thin"
                          : "weak"}
                  </span>
                </div>

                <p className="analyze-summary">{result.summary}</p>

                <div className="analyze-report-grid">
                  <ReportList
                    title="Strengths"
                    items={result.strengths}
                    empty="No clear strengths returned."
                  />
                  <ReportList title="Gaps" items={result.gaps} empty="No gaps listed." />
                  <ReportList
                    title="Keywords to add"
                    items={result.keywords_to_add}
                    empty="No keyword suggestions."
                  />
                  <ReportList
                    title="Recommendations"
                    items={result.recommendations}
                    empty="No recommendations."
                  />
                </div>
              </div>
            )}
          </div>
        </AnimatedCard>
      </div>
    </section>
  );
}
