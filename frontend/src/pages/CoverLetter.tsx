import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import AgentHistoryPanel from "../components/AgentHistoryPanel";
import AnimatedCard from "../components/AnimatedCard";
import { FormSkeleton } from "../components/Skeleton";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../hooks/useAuth";
import { generateCoverLetter, listApplications, listCVs, listJobs } from "../services/api";
import type { Application } from "../types/application";
import type { CV } from "../types/cv";
import type { Job } from "../types/job";
import {
  clearLetterHistory,
  loadLetterHistory,
  newHistoryId,
  prependLetterHistory,
  removeLetterHistory,
  updateLetterHistoryEntry,
  type LetterHistoryEntry,
} from "../utils/agentHistory";
import { saveCoverLetterPdf } from "../utils/saveCoverLetterPdf";

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "warm", label: "Warm" },
  { value: "concise", label: "Concise" },
] as const;

export default function CoverLetterPage() {
  const { token, user } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [editing, setEditing] = useState(false);
  const [history, setHistory] = useState<LetterHistoryEntry[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [jobId, setJobId] = useState("");
  const [cvId, setCvId] = useState("");
  const [tone, setTone] = useState("professional");
  const [analysisSummary, setAnalysisSummary] = useState("");
  const [notes, setNotes] = useState("");

  const [subjectLine, setSubjectLine] = useState("");
  const [letter, setLetter] = useState("");

  useEffect(() => {
    const entries = loadLetterHistory(user?.id);
    setHistory(entries);
    if (entries[0]) {
      setActiveSessionId(entries[0].id);
      setSubjectLine(entries[0].subject_line);
      setLetter(entries[0].letter);
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
      toast.error(err instanceof Error ? err.message : "Failed to load Letters inputs");
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

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

  async function handleDraft(event: FormEvent) {
    event.preventDefault();
    if (!token || !canSubmit) {
      return;
    }

    setDrafting(true);
    setCopyState("idle");
    setEditing(false);

    try {
      const data = await generateCoverLetter(token, {
        job_id: Number(jobId),
        cv_id: Number(cvId),
        analysis_summary: analysisSummary.trim() || undefined,
        notes: notes.trim() || undefined,
        tone,
        save: false,
      });

      const entry: LetterHistoryEntry = {
        id: newHistoryId(),
        createdAt: new Date().toISOString(),
        label: selectedJob ? `${selectedJob.title} · ${selectedJob.company}` : "Cover letter",
        subtitle: selectedCv?.name,
        subject_line: data.subject_line,
        letter: data.letter,
        meta: {
          job_id: data.job_id,
          cv_id: data.cv_id,
          application_id: data.application_id,
          rag_chunks_used: data.rag_chunks_used,
          saved: data.saved,
        },
      };

      setHistory(prependLetterHistory(user?.id, entry));
      setActiveSessionId(entry.id);
      setSubjectLine(data.subject_line);
      setLetter(data.letter);
      toast.success("Draft ready — edit below, then copy when you like it.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not draft cover letter");
    } finally {
      setDrafting(false);
    }
  }

  function handleSelectSession(id: string) {
    const entry = history.find((item) => item.id === id);
    if (!entry) {
      return;
    }
    setActiveSessionId(entry.id);
    setSubjectLine(entry.subject_line);
    setLetter(entry.letter);
    setCopyState("idle");
    setEditing(false);
  }

  function handleRemoveSession(id: string) {
    const next = removeLetterHistory(user?.id, id);
    setHistory(next);
    if (activeSessionId === id) {
      const latest = next[0] ?? null;
      setActiveSessionId(latest?.id ?? null);
      setSubjectLine(latest?.subject_line ?? "");
      setLetter(latest?.letter ?? "");
      setEditing(false);
    }
  }

  function handleClearSessions() {
    clearLetterHistory(user?.id);
    setHistory([]);
    setActiveSessionId(null);
    setSubjectLine("");
    setLetter("");
    setEditing(false);
  }

  function persistEditedDraft() {
    if (!activeSessionId) {
      return;
    }
    setHistory(
      updateLetterHistoryEntry(user?.id, activeSessionId, {
        subject_line: subjectLine,
        letter,
      }),
    );
  }

  function handleStartEdit() {
    setEditing(true);
  }

  function handleDoneEdit() {
    persistEditedDraft();
    setEditing(false);
    toast.success("Edits saved to this session.");
  }

  async function handleSavePdf() {
    try {
      persistEditedDraft();
      const hint = selectedJob?.company || subjectLine || "cover-letter";
      await saveCoverLetterPdf({
        subject: subjectLine,
        letter,
        filenameHint: `cover-letter-${hint}`,
      });
      toast.success("PDF downloaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save PDF");
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
      toast.error("Could not copy to clipboard.");
    }
  }

  return (
    <section className="page-section">
      <div className="page-hero page-hero--animated">
        <p className="page-kicker">Letter studio</p>
        <h1>
          Draft a letter for a <em>pinned role</em>
        </h1>
      </div>

      <div className="jobs-layout">
        <AnimatedCard>
          <article className="panel panel--form">
            <h2>Draft settings</h2>

            {loading ? (
              <FormSkeleton rows={5} />
            ) : jobs.length === 0 || cvs.length === 0 ? (
              <div className="empty-state analyze-prereq-empty">
                {jobs.length === 0 && cvs.length === 0 ? (
                  <>
                    <strong>Need a role and a CV</strong>
                    <p className="empty-state-copy">
                      Letters need something on your Board and in your locker first.
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
                      Add a listing on the Board, then come back to draft a letter.
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
                      Upload a PDF first — Letters needs a CV version to ground the draft.
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
              <form onSubmit={(event) => void handleDraft(event)} className="job-form">
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

                {selectedJob ? (
                  <p className="muted analyze-selection-hint">
                    {selectedJob.company}
                    {selectedCv ? ` · ${selectedCv.name}` : ""}
                  </p>
                ) : null}

                <button type="submit" disabled={!canSubmit || drafting}>
                  {drafting ? "Drafting..." : letter ? "Regenerate draft" : "Draft letter"}
                </button>
              </form>
            )}

            <div className="analyze-sessions-block">
              <AgentHistoryPanel
                embedded
                title="Past sessions"
                emptyText="Past letter drafts will show up here."
                items={history.map((entry) => ({
                  id: entry.id,
                  createdAt: entry.createdAt,
                  label: entry.label,
                  subtitle: entry.subtitle,
                  badge: entry.meta.saved ? "Saved" : undefined,
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
              <h2>Draft</h2>
              {letter ? (
                <div className="letter-studio-actions">
                  {!editing ? (
                    <button type="button" className="btn-ghost" onClick={handleStartEdit}>
                      Edit
                    </button>
                  ) : (
                    <button type="button" className="btn-ghost" onClick={handleDoneEdit}>
                      Done
                    </button>
                  )}
                  <button type="button" className="btn-ghost" onClick={() => void handleSavePdf()}>
                    Save PDF
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => void handleCopy()}>
                    {copyState === "copied" ? "Copied" : "Copy"}
                  </button>
                </div>
              ) : null}
            </div>

            {drafting ? (
              <p className="muted">Writing from the listing and your CV memory...</p>
            ) : !letter ? (
              <div className="empty-state">
                <strong>No draft yet</strong>
                Choose a role and CV, then draft a letter.
              </div>
            ) : (
              <div className={`letter-studio${editing ? " letter-studio--editing" : ""}`}>
                {editing ? (
                  <>
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
                  </>
                ) : (
                  <>
                    {subjectLine.trim() ? (
                      <div className="letter-preview-subject">
                        <span className="letter-preview-label">Subject</span>
                        <p>{subjectLine}</p>
                      </div>
                    ) : null}
                    <div className="letter-preview-body">{letter}</div>
                  </>
                )}
              </div>
            )}
          </div>
        </AnimatedCard>
      </div>
    </section>
  );
}
