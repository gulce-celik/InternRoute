import { useCallback, useEffect, useState, type FormEvent } from "react";

import AnimatedCard from "../components/AnimatedCard";
import PipelineStrip from "../components/PipelineStrip";
import { useAuth } from "../hooks/useAuth";
import {
  createApplication,
  listApplications,
  listCVs,
  listJobs,
  updateApplication,
  updateApplicationStatus,
} from "../services/api";
import type { Application, ApplicationQAItem, ApplicationStatus } from "../types/application";
import type { CV } from "../types/cv";
import type { Job } from "../types/job";
import { mapJobStatusToPipelineStage } from "../utils/jobStatus";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "draft", label: "Saved for later" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

const emptyQaItem = (): ApplicationQAItem => ({ question: "", answer: "" });

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function mapApplicationStatusToPipelineStage(status: ApplicationStatus) {
  if (status === "draft") {
    return "saved" as const;
  }
  if (status === "rejected") {
    return "applied" as const;
  }
  return mapJobStatusToPipelineStage(status);
}

export default function ApplicationsPage() {
  const { token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [form, setForm] = useState({
    job_id: "",
    cv_id: "",
    notes: "",
  });
  const [editNotes, setEditNotes] = useState("");
  const [editCvId, setEditCvId] = useState("");
  const [editQaItems, setEditQaItems] = useState<ApplicationQAItem[]>([emptyQaItem()]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [applicationData, jobData, cvData] = await Promise.all([
        listApplications(token),
        listJobs(token),
        listCVs(token),
      ]);
      setApplications(applicationData);
      setJobs(jobData);
      setCvs(cvData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (applications.length === 0) {
      setSelectedApplicationId(null);
      return;
    }

    if (
      selectedApplicationId === null ||
      !applications.some((application) => application.id === selectedApplicationId)
    ) {
      setSelectedApplicationId(applications[0].id);
    }
  }, [applications, selectedApplicationId]);

  const selectedApplication =
    applications.find((application) => application.id === selectedApplicationId) ?? applications[0];

  useEffect(() => {
    if (!selectedApplication) {
      setEditNotes("");
      setEditCvId("");
      setEditQaItems([emptyQaItem()]);
      return;
    }
    setEditNotes(selectedApplication.notes ?? "");
    setEditCvId(selectedApplication.cv_id != null ? String(selectedApplication.cv_id) : "");
    setEditQaItems(
      selectedApplication.qa_items.length > 0
        ? selectedApplication.qa_items.map((item) => ({ ...item }))
        : [emptyQaItem()],
    );
  }, [selectedApplication]);

  const pipelineStage = selectedApplication
    ? mapApplicationStatusToPipelineStage(selectedApplication.status)
    : "saved";

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!token || !form.job_id || !form.cv_id) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const created = await createApplication(token, {
        job_id: Number(form.job_id),
        cv_id: Number(form.cv_id),
        status: "applied",
        notes: form.notes.trim() || null,
        qa_items: [],
      });
      setApplications((prev) => [created, ...prev]);
      setSelectedApplicationId(created.id);
      setForm({ job_id: "", cv_id: "", notes: "" });
      setSuccess("Application linked. Add written Q&A in the file below if you had screening questions.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create application");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(applicationId: number, status: ApplicationStatus) {
    if (!token) {
      return;
    }

    setUpdatingId(applicationId);
    setError(null);

    try {
      const updated = await updateApplicationStatus(token, applicationId, status);
      setApplications((prev) =>
        prev.map((application) => (application.id === applicationId ? updated : application)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSaveDetails(event: FormEvent) {
    event.preventDefault();
    if (!token || !selectedApplication) {
      return;
    }

    setSavingDetails(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateApplication(token, selectedApplication.id, {
        cv_id: editCvId ? Number(editCvId) : null,
        notes: editNotes.trim() || null,
        qa_items: editQaItems.filter((item) => item.question.trim()),
      });
      setApplications((prev) =>
        prev.map((application) => (application.id === updated.id ? updated : application)),
      );
      setSuccess("Application CV, notes, and written answers saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save application details");
    } finally {
      setSavingDetails(false);
    }
  }

  return (
    <section className="page-section">
      <div className="page-hero page-hero--animated">
        <p className="page-kicker">Your flow</p>
        <h1>
          Application <em>pipeline</em>
        </h1>
        <p className="page-description">
          Track every application end-to-end: which CV you sent, status, notes, and any written
          screening questions you answered.
        </p>
      </div>

      {error && <p className="error banner-error">{error}</p>}
      {success && <p className="banner-success">{success}</p>}

      <PipelineStrip activeStage={pipelineStage} />

      {selectedApplication && applications.length > 0 && (
        <p className="pipeline-focus-label">
          Showing pipeline for <strong>{selectedApplication.job_title}</strong>
          <span className="pipeline-focus-meta"> · {selectedApplication.job_company}</span>
          <span className="pipeline-focus-meta">
            {" "}
            · CV: {selectedApplication.cv_filename ?? "not selected"}
          </span>
        </p>
      )}

      <div className="jobs-layout">
        <AnimatedCard>
          <article className="panel panel--form">
            <h2>Link job + CV</h2>
            <form onSubmit={handleCreate} className="job-form">
              <label>
                Role
                <select
                  value={form.job_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, job_id: event.target.value }))}
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
                  value={form.cv_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, cv_id: event.target.value }))}
                  required
                >
                  <option value="">Select a CV</option>
                  {cvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.filename}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Application notes
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  rows={3}
                  placeholder="Portal link, deadline, recruiter name…"
                />
              </label>

              <p className="muted">
                After linking, use <strong>Application file</strong> below to save written screening
                questions and your answers.
              </p>

              <button type="submit" disabled={submitting || jobs.length === 0 || cvs.length === 0}>
                {submitting ? "Linking..." : "Create application"}
              </button>
            </form>
            {(jobs.length === 0 || cvs.length === 0) && (
              <p className="muted">
                Pin at least one role on the Board and upload one CV before linking applications.
              </p>
            )}
          </article>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <div className="panel">
            <h2>Matched applications</h2>

            {loading ? (
              <p className="muted">Loading your pipeline...</p>
            ) : applications.length === 0 ? (
              <div className="empty-state">
                <strong>No applications linked yet</strong>
                Choose a role and CV above to start tracking which version you sent.
              </div>
            ) : (
              <div className="pipeline-preview-grid">
                {applications.map((application, index) => {
                  const isSelected = application.id === selectedApplicationId;
                  const qaCount = application.qa_items?.length ?? 0;

                  return (
                    <AnimatedCard key={application.id} delay={index * 80}>
                      <article
                        className={`flow-card flow-card--drift flow-card--selectable${isSelected ? " flow-card--selected" : ""}`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        aria-label={`Show pipeline for ${application.job_title}`}
                        onClick={() => setSelectedApplicationId(application.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedApplicationId(application.id);
                          }
                        }}
                      >
                        <span className="flow-card-pin" aria-hidden="true" />
                        <h3>{application.job_title}</h3>
                        <p className="job-meta">
                          {application.job_company} · CV:{" "}
                          {application.cv_filename ?? "not selected yet"}
                        </p>
                        <p className="job-meta">
                          {application.notes ? "Notes saved · " : "No notes · "}
                          {qaCount} written Q&amp;A
                        </p>
                        <div className="flow-card-footer">
                          <label className="status-select-label">
                            Status
                            <select
                              value={application.status}
                              disabled={updatingId === application.id}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) =>
                                void handleStatusChange(
                                  application.id,
                                  event.target.value as ApplicationStatus,
                                )
                              }
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <span className="job-date">
                            {mapApplicationStatusToPipelineStage(application.status)} · Linked{" "}
                            {formatDate(application.created_at)}
                          </span>
                        </div>
                      </article>
                    </AnimatedCard>
                  );
                })}
              </div>
            )}
          </div>
        </AnimatedCard>
      </div>

      {selectedApplication && (
        <AnimatedCard delay={160}>
          <article className="panel memory-panel">
            <h2>Application file — CV, notes &amp; written answers</h2>
            <p className="muted">
              Keep everything for <strong>{selectedApplication.job_title}</strong> in one place. You
              can change the CV later if you picked the wrong version.
            </p>
            <form onSubmit={handleSaveDetails} className="job-form">
              <label>
                CV version
                <select value={editCvId} onChange={(event) => setEditCvId(event.target.value)}>
                  <option value="">No CV selected</option>
                  {cvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.filename}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Notes
                <textarea
                  value={editNotes}
                  onChange={(event) => setEditNotes(event.target.value)}
                  rows={3}
                  placeholder="Follow-up email, recruiter, next step…"
                />
              </label>

              <div className="qa-block">
                <div className="qa-block-header">
                  <strong>Written Q&amp;A</strong>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setEditQaItems((prev) => [...prev, emptyQaItem()])}
                  >
                    + Add question
                  </button>
                </div>
                {editQaItems.map((item, index) => (
                  <div key={`edit-qa-${index}`} className="qa-item">
                    <label>
                      Question {index + 1}
                      <input
                        type="text"
                        value={item.question}
                        onChange={(event) =>
                          setEditQaItems((prev) => {
                            const next = [...prev];
                            next[index] = { ...next[index], question: event.target.value };
                            return next;
                          })
                        }
                      />
                    </label>
                    <label>
                      Your answer
                      <textarea
                        value={item.answer}
                        onChange={(event) =>
                          setEditQaItems((prev) => {
                            const next = [...prev];
                            next[index] = { ...next[index], answer: event.target.value };
                            return next;
                          })
                        }
                        rows={3}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={savingDetails}>
                {savingDetails ? "Saving..." : "Save CV, notes & Q&A"}
              </button>
            </form>
          </article>
        </AnimatedCard>
      )}
    </section>
  );
}
