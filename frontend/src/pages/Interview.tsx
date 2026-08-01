import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Link, useSearchParams } from "react-router-dom";

import AgentHistoryPanel from "../components/AgentHistoryPanel";
import AnimatedCard from "../components/AnimatedCard";
import { FormSkeleton } from "../components/Skeleton";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../hooks/useAuth";
import {
  answerMockInterview,
  clearMockInterviews,
  deleteMockInterview,
  getMockInterview,
  listApplications,
  listCVs,
  listJobs,
  listMockInterviews,
  startMockInterview,
} from "../services/api";
import type {
  InterviewSummary,
  InterviewTurn,
  MockInterviewSessionListItem,
} from "../types/agents";
import type { Application } from "../types/application";
import type { CV } from "../types/cv";
import type { Job } from "../types/job";

type ChatBubble = {
  id: string;
  role: "interviewer" | "student";
  content: string;
  feedback?: string | null;
};

function transcriptToBubbles(transcript: InterviewTurn[]): ChatBubble[] {
  return transcript.map((turn, index) => ({
    id: `t-${index}-${turn.role}`,
    role: turn.role === "student" ? "student" : "interviewer",
    content: turn.content,
    feedback: turn.feedback,
  }));
}

function formatSummaryText(summary: InterviewSummary): string {
  const bullet = (items: string[]) =>
    items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- (none)";
  return [
    "Mock interview summary",
    "",
    summary.overall.trim() || "(no overall)",
    "",
    "Strengths:",
    bullet(summary.strengths),
    "",
    "Improvements:",
    bullet(summary.improvements),
    "",
    "Practice tips:",
    bullet(summary.practice_tips),
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

export default function InterviewPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [sessions, setSessions] = useState<MockInterviewSessionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [jobId, setJobId] = useState("");
  const [cvId, setCvId] = useState("");

  const [phase, setPhase] = useState<"setup" | "live">("setup");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [status, setStatus] = useState("active");
  const [questionIndex, setQuestionIndex] = useState(1);
  const [questionLimit, setQuestionLimit] = useState(6);
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [summary, setSummary] = useState<InterviewSummary | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  const [answer, setAnswer] = useState("");
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const loadData = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      const [jobData, cvData, applicationData, sessionData] = await Promise.all([
        listJobs(token),
        listCVs(token),
        listApplications(token),
        listMockInterviews(token),
      ]);
      setJobs(jobData);
      setCvs(cvData);
      setApplications(applicationData);
      setSessions(sessionData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load interview inputs");
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

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    chatEndRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [bubbles, sending, summary]);

  const selectedJob = jobs.find((job) => String(job.id) === jobId);
  const selectedCv = cvs.find((cv) => String(cv.id) === cvId);
  const canStart = Boolean(jobId && cvId);
  const isCompleted = status === "completed";
  const canSend = phase === "live" && !isCompleted && !sending && answer.trim().length > 0;

  async function refreshSessions() {
    if (!token) {
      return;
    }
    try {
      setSessions(await listMockInterviews(token));
    } catch {
      // Non-blocking — chat can continue without a fresh list.
    }
  }

  async function handleStart(event: FormEvent) {
    event.preventDefault();
    if (!token || !canStart) {
      return;
    }

    setStarting(true);
    try {
      const data = await startMockInterview(token, {
        job_id: Number(jobId),
        cv_id: Number(cvId),
      });

      setPhase("live");
      setSessionId(data.session_id);
      setStatus(data.status);
      setQuestionIndex(data.question_index);
      setQuestionLimit(data.question_limit);
      setJobTitle(selectedJob?.title ?? "");
      setJobCompany(selectedJob?.company ?? "");
      setSummary(null);
      setLastFeedback(null);
      setAnswer("");
      setBubbles([
        {
          id: `start-${data.session_id}`,
          role: "interviewer",
          content: data.question,
        },
      ]);
      await refreshSessions();
      window.setTimeout(() => inputRef.current?.focus(), 50);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start mock interview");
    } finally {
      setStarting(false);
    }
  }

  async function handleSend() {
    if (!token || sessionId == null || !canSend) {
      return;
    }

    const text = answer.trim();
    setSending(true);
    setAnswer("");
    setBubbles((prev) => [
      ...prev,
      { id: `student-${Date.now()}`, role: "student", content: text },
    ]);

    try {
      const data = await answerMockInterview(token, {
        session_id: sessionId,
        answer: text,
      });

      setLastFeedback(data.feedback);
      setQuestionIndex(data.question_index);
      setStatus(data.status);

      setBubbles((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i -= 1) {
          if (next[i].role === "student") {
            next[i] = { ...next[i], feedback: data.feedback };
            break;
          }
        }
        if (data.question) {
          next.push({
            id: `q-${data.question_index}-${Date.now()}`,
            role: "interviewer",
            content: data.question,
          });
        }
        return next;
      });

      if (data.completed) {
        setSummary(data.summary);
        await refreshSessions();
      } else {
        window.setTimeout(() => inputRef.current?.focus(), 50);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send answer");
      setBubbles((prev) => prev.slice(0, -1));
      setAnswer(text);
    } finally {
      setSending(false);
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  async function handleSelectSession(id: string) {
    if (!token) {
      return;
    }
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return;
    }

    setLoadingSession(true);
    try {
      const data = await getMockInterview(token, numericId);
      setPhase("live");
      setSessionId(data.session_id);
      setStatus(data.status);
      setQuestionIndex(data.question_index);
      setQuestionLimit(data.question_limit);
      setJobTitle(data.job_title);
      setJobCompany(data.job_company);
      setBubbles(transcriptToBubbles(data.transcript));
      setSummary(data.summary);
      setJobId(String(data.job_id));
      setCvId(String(data.cv_id));

      const lastStudent = [...data.transcript].reverse().find((turn) => turn.role === "student");
      setLastFeedback(lastStudent?.feedback ?? null);
      setAnswer("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open session");
    } finally {
      setLoadingSession(false);
    }
  }

  async function handleRemoveSession(id: string) {
    if (!token) {
      return;
    }
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return;
    }

    try {
      await deleteMockInterview(token, numericId);
      setSessions((prev) => prev.filter((session) => session.session_id !== numericId));
      if (sessionId === numericId) {
        handleBackToSetup();
      }
      toast.success("Practice session removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove session");
    }
  }

  async function handleClearSessions() {
    if (!token) {
      return;
    }

    try {
      await clearMockInterviews(token);
      setSessions([]);
      if (sessionId != null) {
        handleBackToSetup();
      }
      toast.success("Past practice sessions cleared.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not clear sessions");
    }
  }

  function handleBackToSetup() {
    setPhase("setup");
    setSessionId(null);
    setBubbles([]);
    setSummary(null);
    setLastFeedback(null);
    setAnswer("");
    setStatus("active");
    setCopyState("idle");
  }

  function handlePracticeAgain() {
    setPhase("setup");
    setSessionId(null);
    setBubbles([]);
    setSummary(null);
    setLastFeedback(null);
    setAnswer("");
    setStatus("active");
    setCopyState("idle");
  }

  async function handleCopySummary() {
    if (!summary) {
      return;
    }
    try {
      await navigator.clipboard.writeText(formatSummaryText(summary));
      setCopyState("copied");
      toast.success("Summary copied.");
      window.setTimeout(() => setCopyState("idle"), 2500);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }

  const progressDots = Array.from({ length: questionLimit }, (_, index) => index + 1);

  if (phase === "live") {
    return (
      <section className="page-section interview-page">
        <div className="interview-session-bar">
          <div className="interview-session-meta">
            <p className="page-kicker">Mock interview</p>
            <h1>
              {jobCompany || "Role"} <em>· {jobTitle || "Practice"}</em>
            </h1>
            <p className="muted interview-progress-label">
              {isCompleted
                ? "Session complete"
                : `Question ${Math.min(questionIndex, questionLimit)} / ${questionLimit}`}
            </p>
          </div>
          <div className="interview-session-actions">
            <div className="interview-progress-dots" aria-hidden="true">
              {progressDots.map((dot) => (
                <span
                  key={dot}
                  className={`interview-progress-dot${
                    dot < questionIndex || (dot === questionIndex && !isCompleted)
                      ? " interview-progress-dot--active"
                      : ""
                  }${isCompleted ? " interview-progress-dot--done" : ""}`}
                />
              ))}
            </div>
            <button type="button" className="btn-ghost" onClick={handleBackToSetup}>
              {isCompleted ? "Back" : "End"}
            </button>
          </div>
        </div>

        <div className="interview-live-layout">
          <AnimatedCard>
            <div className="panel interview-chat-panel">
              {loadingSession ? (
                <p className="muted">Loading session...</p>
              ) : (
                <>
                  <div className="interview-chat-thread" role="log" aria-live="polite">
                    {bubbles.map((bubble) => (
                      <div
                        key={bubble.id}
                        className={`interview-bubble interview-bubble--${bubble.role}`}
                      >
                        <span className="interview-bubble-role">
                          {bubble.role === "interviewer" ? "Interviewer" : "You"}
                        </span>
                        <p className="interview-bubble-text">{bubble.content}</p>
                        {bubble.feedback ? (
                          <p className="interview-bubble-feedback">{bubble.feedback}</p>
                        ) : null}
                      </div>
                    ))}
                    {sending ? (
                      <div className="interview-bubble interview-bubble--interviewer interview-bubble--thinking">
                        <span className="interview-bubble-role">Interviewer</span>
                        <p className="interview-bubble-text">Thinking...</p>
                      </div>
                    ) : null}
                    <div ref={chatEndRef} />
                  </div>

                  {isCompleted ? (
                    <div className="interview-composer interview-composer--done">
                      <p className="muted">
                        This practice round is done. Review the coaching rail or practice again.
                      </p>
                      <div className="interview-composer-actions">
                        <button type="button" onClick={handlePracticeAgain}>
                          Practice again
                        </button>
                        <Link to="/applications" className="btn-ghost desk-zone-cta">
                          Open Pipeline
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <form
                      className="interview-composer"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleSend();
                      }}
                    >
                      <label className="interview-composer-label" htmlFor="interview-answer">
                        Your answer
                      </label>
                      <textarea
                        id="interview-answer"
                        ref={inputRef}
                        rows={3}
                        value={answer}
                        onChange={(event) => setAnswer(event.target.value)}
                        onKeyDown={handleComposerKeyDown}
                        placeholder="Type your answer — Enter to send, Shift+Enter for a new line"
                        disabled={sending}
                      />
                      <div className="interview-composer-actions">
                        <button type="submit" className="studio-primary-cta" disabled={!canSend}>
                          {sending ? "Sending..." : "Send answer"}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </AnimatedCard>

          <AnimatedCard delay={80}>
            <aside className="panel interview-coach-rail">
              <h2>Coaching</h2>
              <p className="muted interview-coach-tip">
                Aim for STAR: Situation, Task, Action, Result — keep answers concrete.
              </p>

              <div className="interview-coach-block">
                <h3>Latest feedback</h3>
                {lastFeedback ? (
                  <p>{lastFeedback}</p>
                ) : (
                  <p className="muted">Feedback appears here after each answer.</p>
                )}
              </div>

              {summary ? (
                <div className="interview-summary">
                  <div className="letter-studio-head">
                    <h3>Session summary</h3>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => void handleCopySummary()}
                    >
                      {copyState === "copied" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="analyze-summary">{summary.overall}</p>
                  <div className="analyze-report-grid interview-summary-grid">
                    <ReportList
                      title="Strengths"
                      items={summary.strengths}
                      empty="No strengths listed."
                    />
                    <ReportList
                      title="Improvements"
                      items={summary.improvements}
                      empty="No improvements listed."
                    />
                    <ReportList
                      title="Practice tips"
                      items={summary.practice_tips}
                      empty="No tips listed."
                    />
                  </div>
                </div>
              ) : null}
            </aside>
          </AnimatedCard>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section interview-page">
      <div className="page-hero page-hero--animated">
        <p className="page-kicker">HR mock agent</p>
        <h1>
          Practice before the <em>real call</em>
        </h1>
      </div>

      <div className="jobs-layout jobs-layout--with-sessions studio-layout">
        <AnimatedCard>
          <article className="panel panel--form" id="interview-form">
            <h2>Start practice</h2>

            {loading ? (
              <FormSkeleton rows={4} />
            ) : jobs.length === 0 || cvs.length === 0 ? (
              <div className="empty-state analyze-prereq-empty">
                {jobs.length === 0 && cvs.length === 0 ? (
                  <>
                    <strong>Need a role and a CV</strong>
                    <p className="empty-state-copy">
                      Mock interview needs something on your Board and in your locker first.
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
                      Add a listing on the Board, then come back to practice for that role.
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
                      Upload a PDF first — the interviewer needs a CV version for role-fit questions.
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
              <form onSubmit={(event) => void handleStart(event)} className="job-form">
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

                <button type="submit" className="studio-primary-cta" disabled={!canStart || starting}>
                  {starting ? "Starting..." : "Start practice"}
                </button>
              </form>
            )}
          </article>
        </AnimatedCard>

        <AnimatedCard delay={80}>
          <div className="panel studio-result-panel">
            <div className="letter-studio-head">
              <h2>How it works</h2>
            </div>
            <ul className="interview-howto-list">
              <li>Pick the role you are preparing for and the CV you would send.</li>
              <li>Answer 5–7 short HR-style questions with light role-fit follow-ups.</li>
              <li>Get coaching after each turn, then a summary you can copy and reuse.</li>
              <li>Answers are saved to your prep memory for smarter practice next time.</li>
            </ul>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={140}>
          <AgentHistoryPanel
            title="Past sessions"
            emptyText="Completed practice rounds will show up here."
            items={sessions.map((session) => ({
              id: String(session.session_id),
              createdAt: session.created_at ?? new Date().toISOString(),
              label: session.job_title
                ? `${session.job_title} · ${session.job_company}`
                : `Session ${session.session_id}`,
              badge:
                session.status === "completed"
                  ? "Completed"
                  : session.status === "abandoned"
                    ? "Abandoned"
                    : "Active",
            }))}
            activeId={sessionId != null ? String(sessionId) : null}
            onSelect={(id) => void handleSelectSession(id)}
            onRemove={(id) => void handleRemoveSession(id)}
            onClear={() => void handleClearSessions()}
          />
        </AnimatedCard>
      </div>
    </section>
  );
}
