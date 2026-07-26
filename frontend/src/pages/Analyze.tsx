import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import AnimatedCard from "../components/AnimatedCard";
import { FormSkeleton } from "../components/Skeleton";
import { useAuth } from "../hooks/useAuth";
import { analyzeJobCv, listApplications, listCVs, listJobs } from "../services/api";
import type { AnalyzeResult } from "../types/agents";
import type { Application } from "../types/application";
import type { CV } from "../types/cv";
import type { Job } from "../types/job";

type SourceMode = "pair" | "application";

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
  const { token } = useAuth();
  const [searchParams] = useSearchParams();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const [mode, setMode] = useState<SourceMode>("pair");
  const [jobId, setJobId] = useState("");
  const [cvId, setCvId] = useState("");
  const [applicationId, setApplicationId] = useState("");

  const loadData = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);

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
      setError(err instanceof Error ? err.message : "Failed to load Analyze inputs");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Prefill from query string (Pipeline deep links later).
  useEffect(() => {
    if (loading) {
      return;
    }

    const qApp = searchParams.get("application_id");
    const qJob = searchParams.get("job_id");
    const qCv = searchParams.get("cv_id");

    if (qApp && applications.some((item) => String(item.id) === qApp)) {
      setMode("application");
      setApplicationId(qApp);
      return;
    }

    if (qJob && jobs.some((item) => String(item.id) === qJob)) {
      setMode("pair");
      setJobId(qJob);
    }
    if (qCv && cvs.some((item) => String(item.id) === qCv)) {
      setMode("pair");
      setCvId(qCv);
    }
  }, [loading, searchParams, jobs, cvs, applications]);

  const linkedApplications = useMemo(
    () => applications.filter((item) => item.cv_id != null),
    [applications],
  );

  const selectedJob = jobs.find((job) => String(job.id) === jobId);
  const selectedCv = cvs.find((cv) => String(cv.id) === cvId);
  const selectedApplication = applications.find((item) => String(item.id) === applicationId);

  const canSubmit =
    mode === "application"
      ? Boolean(applicationId)
      : Boolean(jobId && cvId);

  async function handleAnalyze(event: FormEvent) {
    event.preventDefault();
    if (!token || !canSubmit) {
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const payload =
        mode === "application"
          ? { application_id: Number(applicationId) }
          : { job_id: Number(jobId), cv_id: Number(cvId) };
      const data = await analyzeJobCv(token, payload);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
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

      {error && <p className="error banner-error">{error}</p>}

      <div className="jobs-layout">
        <AnimatedCard>
          <article className="panel panel--form">
            <h2>Run analysis</h2>

            {loading ? (
              <FormSkeleton rows={4} />
            ) : jobs.length === 0 || cvs.length === 0 ? (
              <div className="empty-state">
                <strong>Need a role and a CV</strong>
                Pin a listing on the{" "}
                <Link to="/jobs">Board</Link> and upload a PDF in the{" "}
                <Link to="/cvs">Locker</Link> first.
              </div>
            ) : (
              <form onSubmit={(event) => void handleAnalyze(event)} className="job-form">
                <fieldset className="analyze-mode">
                  <legend>Source</legend>
                  <label className="analyze-mode-option">
                    <input
                      type="radio"
                      name="analyze-mode"
                      checked={mode === "pair"}
                      onChange={() => setMode("pair")}
                    />
                    Job + CV
                  </label>
                  <label className="analyze-mode-option">
                    <input
                      type="radio"
                      name="analyze-mode"
                      checked={mode === "application"}
                      onChange={() => setMode("application")}
                      disabled={linkedApplications.length === 0}
                    />
                    Pipeline match
                  </label>
                </fieldset>

                {mode === "pair" ? (
                  <>
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
                            {cv.filename}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : (
                  <label>
                    Application
                    <select
                      value={applicationId}
                      onChange={(event) => setApplicationId(event.target.value)}
                      required
                    >
                      <option value="">Select a pipeline card</option>
                      {linkedApplications.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.job_title} · {item.job_company}
                          {item.cv_filename ? ` · ${item.cv_filename}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {(selectedJob || selectedApplication) && mode === "pair" && selectedJob && (
                  <p className="muted analyze-selection-hint">
                    {selectedJob.company}
                    {selectedCv ? ` · ${selectedCv.filename}` : ""}
                  </p>
                )}
                {mode === "application" && selectedApplication && (
                  <p className="muted analyze-selection-hint">
                    Status: {selectedApplication.status}
                    {selectedApplication.cv_filename
                      ? ` · ${selectedApplication.cv_filename}`
                      : ""}
                  </p>
                )}

                <button type="submit" disabled={!canSubmit || analyzing}>
                  {analyzing ? "Scanning..." : "Run gap scan"}
                </button>
              </form>
            )}
          </article>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <div className="panel">
            <h2>Report</h2>

            {analyzing ? (
              <p className="muted">Comparing the listing to your CV memory...</p>
            ) : !result ? (
              <div className="empty-state">
                <strong>No report yet</strong>
                Choose a role and CV, then run a gap scan. Results stay on this page until you run
                another.
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

                <p className="muted analyze-meta">
                  Used {result.rag_chunks_used} CV memory chunk
                  {result.rag_chunks_used === 1 ? "" : "s"}
                  {result.rag_chunks_used === 0
                    ? " — upload or reingest a fuller CV for richer results."
                    : "."}
                </p>

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
