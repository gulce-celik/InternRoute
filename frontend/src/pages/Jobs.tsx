import { useCallback, useEffect, useState, type FormEvent } from "react";

import AnimatedCard from "../components/AnimatedCard";
import { useAuth } from "../hooks/useAuth";
import { createJob, deleteJob, listJobs } from "../services/api";
import type { Job, JobCreate } from "../types/job";

const STATUS_OPTIONS = [
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "draft", label: "Saved for later" },
] as const;

const emptyForm: JobCreate = {
  title: "",
  company: "",
  description: "",
  location: "",
  status: "applied",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function JobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState<JobCreate>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await listJobs(token);
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const created = await createJob(token, {
        title: form.title,
        company: form.company,
        description: form.description,
        location: form.location?.trim() || undefined,
        status: form.status,
      });
      setJobs((prev) => [created, ...prev]);
      setForm(emptyForm);
      setSuccess("Role pinned to your board!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!token) {
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      await deleteJob(token, id);
      setJobs((prev) => prev.filter((job) => job.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete job");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="page-section">
      <div className="page-hero page-hero--animated">
        <p className="page-kicker">Live board</p>
        <h1>
          Pin every role on your <em>board</em>
        </h1>
        <p className="page-description">
          Found a listing on LinkedIn, Kariyer.net, or a friend&apos;s WhatsApp? Drop it here and
          track where you stand.
        </p>
      </div>

      {error && <p className="error banner-error">{error}</p>}
      {success && <p className="banner-success">{success}</p>}

      <div className="jobs-layout">
        <AnimatedCard>
          <article className="panel panel--form">
          <h2>New listing</h2>
          <form onSubmit={handleSubmit} className="job-form">
            <label>
              Title
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </label>
            <label>
              Company
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                required
              />
            </label>
            <label>
              Location
              <input
                type="text"
                value={form.location ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Optional"
              />
            </label>
            <label>
              Status
              <select
                value={form.status ?? "applied"}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save role"}
            </button>
          </form>
          </article>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <div className="panel">
          <h2>Pinned roles</h2>

          {loading ? (
            <p className="muted">Loading your roles...</p>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <strong>No roles yet</strong>
              Add your first internship listing and start building your pipeline.
            </div>
          ) : (
            <ul className="jobs-list">
              {jobs.map((job, index) => (
                <li key={job.id}>
                  <AnimatedCard delay={index * 70} className="job-card-wrap">
                    <article className="job-card job-card--float">
                  <div className="job-card-header">
                    <div>
                      <h3>{job.title}</h3>
                      <p className="job-meta">
                        {job.company}
                        {job.location ? ` · ${job.location}` : ""}
                      </p>
                    </div>
                    <span className={`status-badge status-badge--${job.status}`}>{job.status}</span>
                  </div>
                  <p className="job-description">{job.description}</p>
                  <div className="job-card-footer">
                    <span className="job-date">Added {formatDate(job.created_at)}</span>
                    <button
                      type="button"
                      className="btn-danger"
                      disabled={deletingId === job.id}
                      onClick={() => void handleDelete(job.id)}
                    >
                      {deletingId === job.id ? "Deleting..." : "Delete"}
                    </button>
                    </div>
                    </article>
                  </AnimatedCard>
                </li>
              ))}
            </ul>
          )}
          </div>
        </AnimatedCard>
      </div>
    </section>
  );
}
