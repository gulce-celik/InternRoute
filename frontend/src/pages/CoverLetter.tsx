import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import AnimatedCard from "../components/AnimatedCard";
import { FormSkeleton } from "../components/Skeleton";
import { useAuth } from "../hooks/useAuth";
import { generateCoverLetter, listApplications, listCVs, listJobs } from "../services/api";
import type { CoverLetterResult } from "../types/agents";
import type { Application } from "../types/application";
import type { CV } from "../types/cv";
import type { Job } from "../types/job";

type SourceMode = "pair" | "application";

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "warm", label: "Warm" },
  { value: "concise", label: "Concise" },
] as const;

export default function CoverLetterPage() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const [mode, setMode] = useState<SourceMode>("pair");
  const [jobId, setJobId] = useState("");
  const [cvId, setCvId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [tone, setTone] = useState("professional");
  const [analysisSummary, setAnalysisSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [saveToApplication, setSaveToApplication] = useState(true);

  const [resultMeta, setResultMeta] = useState<Pick<
    CoverLetterResult,
    "job_id" | "cv_id" | "application_id" | "rag_chunks_used" | "saved"
  > | null>(null);
  const [subjectLine, setSubjectLine] = useState("");
  const [letter, setLetter] = useState("");

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
      setError(err instanceof Error ? err.message : "Failed to load Letters inputs");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const qApp = searchParams.get("application_id");
    const qJob = searchParams.get("job_id");
    const qCv = searchParams.get("cv_id");
    const qSummary = searchParams.get("analysis_summary");

    if (qSummary) {
      setAnalysisSummary(qSummary);
    }

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
    mode === "application" ? Boolean(applicationId) : Boolean(jobId && cvId);

  async function handleDraft(event: FormEvent) {
    event.preventDefault();
    if (!token || !canSubmit) {
      return;
    }

    setDrafting(true);
    setError(null);
    setSuccess(null);
    setCopyState("idle");

    try {
      const payload =
        mode === "application"
          ? {
              application_id: Number(applicationId),
              analysis_summary: analysisSummary.trim() || undefined,
              notes: notes.trim() || undefined,
              tone,
              save: saveToApplication,
            }
          : {
              job_id: Number(jobId),
              cv_id: Number(cvId),
              analysis_summary: analysisSummary.trim() || undefined,
              notes: notes.trim() || undefined,
              tone,
              save: false,
            };

      const data = await generateCoverLetter(token, payload);
      setSubjectLine(data.subject_line);
      setLetter(data.letter);
      setResultMeta({
        job_id: data.job_id,
        cv_id: data.cv_id,
        application_id: data.application_id,
        rag_chunks_used: data.rag_chunks_used,
        saved: data.saved,
      });
      setSuccess(
        data.saved
          ? "Draft ready and saved on the pipeline application."
          : "Draft ready — edit below, then copy when you like it.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not draft cover letter");
    } finally {
      setDrafting(false);
    }
  }

  async function handleCopy() {
    const text = [subjectLine.trim() && `Subject: ${subjectLine.trim()}`, letter.trim()]
      .filter(Boolean)
      .join("\n\n");
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  return (
    <section className="page-section">
      <div className="page-hero page-hero--animated">
        <p className="page-kicker">Letter studio</p>
        <h1>
          Draft a letter for a <em>pinned role</em>
        </h1>
        <p className="page-description">
          Grounded in the listing and your CV memory — not a generic template. Edit the draft,
          copy it out, and when you use a Pipeline match it can save on that application.
        </p>
      </div>

      {error && <p className="error banner-error">{error}</p>}
      {success && <p className="banner-success">{success}</p>}

      <div className="jobs-layout">
        <AnimatedCard>
          <article className="panel panel--form">
            <h2>Draft settings</h2>

            {loading ? (
              <FormSkeleton rows={5} />
            ) : jobs.length === 0 || cvs.length === 0 ? (
              <div className="empty-state">
                <strong>Need a role and a CV</strong>
                Pin a listing on the <Link to="/jobs">Board</Link> and upload a PDF in the{" "}
                <Link to="/cvs">Locker</Link> first. Optionally run{" "}
                <Link to="/analyze">Analyze</Link> and paste the summary below.
              </div>
            ) : (
              <form onSubmit={(event) => void handleDraft(event)} className="job-form">
                <fieldset className="analyze-mode">
                  <legend>Source</legend>
                  <label className="analyze-mode-option">
                    <input
                      type="radio"
                      name="letter-mode"
                      checked={mode === "pair"}
                      onChange={() => setMode("pair")}
                    />
                    Job + CV
                  </label>
                  <label className="analyze-mode-option">
                    <input
                      type="radio"
                      name="letter-mode"
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
                  <>
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
                    <label className="analyze-mode-option letter-save-option">
                      <input
                        type="checkbox"
                        checked={saveToApplication}
                        onChange={(event) => setSaveToApplication(event.target.checked)}
                      />
                      Save draft on this application
                    </label>
                  </>
                )}

                <label>
                  Tone
                  <select value={tone} onChange={(event) => setTone(event.target.value)}>
                    {TONE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Analyzer summary (optional)
                  <textarea
                    value={analysisSummary}
                    onChange={(event) => setAnalysisSummary(event.target.value)}
                    rows={3}
                    placeholder="Paste strengths / gaps from Analyze if you have them"
                  />
                </label>

                <label>
                  Extra notes (optional)
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={2}
                    placeholder="e.g. shorter, mention React project, Turkish greeting"
                  />
                </label>

                {mode === "pair" && selectedJob && (
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

                <button type="submit" disabled={!canSubmit || drafting}>
                  {drafting ? "Drafting..." : letter ? "Regenerate draft" : "Draft letter"}
                </button>
              </form>
            )}
          </article>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <div className="panel">
            <div className="letter-studio-head">
              <h2>Draft</h2>
              {letter ? (
                <button type="button" className="btn-ghost" onClick={() => void handleCopy()}>
                  {copyState === "copied" ? "Copied" : "Copy"}
                </button>
              ) : null}
            </div>

            {drafting ? (
              <p className="muted">Writing from the listing and your CV memory...</p>
            ) : !letter ? (
              <div className="empty-state">
                <strong>No draft yet</strong>
                Choose a role and CV, then draft a letter. You can edit every line before you copy
                or save.
              </div>
            ) : (
              <div className="letter-studio">
                <label>
                  Subject line
                  <input
                    type="text"
                    value={subjectLine}
                    onChange={(event) => setSubjectLine(event.target.value)}
                    placeholder="Optional email subject"
                  />
                </label>
                <label>
                  Letter
                  <textarea
                    className="letter-editor"
                    value={letter}
                    onChange={(event) => setLetter(event.target.value)}
                    rows={16}
                  />
                </label>
                {resultMeta && (
                  <p className="muted analyze-meta">
                    Used {resultMeta.rag_chunks_used} CV memory chunk
                    {resultMeta.rag_chunks_used === 1 ? "" : "s"}
                    {resultMeta.saved ? " · saved on application" : ""}
                    {resultMeta.rag_chunks_used === 0
                      ? " — fuller CV memory makes stronger letters."
                      : "."}
                  </p>
                )}
              </div>
            )}
          </div>
        </AnimatedCard>
      </div>
    </section>
  );
}
