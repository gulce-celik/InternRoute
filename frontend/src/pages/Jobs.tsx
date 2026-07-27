import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import AnimatedCard from "../components/AnimatedCard";
import CalendarEventForm from "../components/CalendarEventForm";
import ConfirmCard from "../components/ConfirmCard";
import { ListSkeleton } from "../components/Skeleton";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../hooks/useAuth";
import { createCalendarEvent, createJob, deleteJob, listJobs } from "../services/api";
import type { CalendarEventCategory } from "../types/calendar";
import { CALENDAR_CATEGORIES } from "../types/calendar";
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
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function JobsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState<JobCreate>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [eventCategory, setEventCategory] = useState<CalendarEventCategory>("language_test");
  const [eventNote, setEventNote] = useState("");
  const [eventJobId, setEventJobId] = useState<number | null>(null);

  const loadJobs = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const data = await listJobs(token);
      setJobs(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      return;
    }

    setSubmitting(true);

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

      if (eventDate) {
        try {
          await createCalendarEvent(token, {
            category: eventCategory,
            event_date: eventDate,
            title: `${form.title} · ${form.company}`,
            notes: eventNote.trim() || null,
            job_id: created.id,
          });
          toast.success("Role pinned and deadline added to Calendar.");
        } catch {
          toast.success("Role pinned — calendar event could not be saved.");
        }
        setEventDate("");
        setEventNote("");
      } else {
        toast.success("Role pinned to your board!");
      }
      setEventJobId(created.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!token) {
      return;
    }

    setDeletingId(id);

    try {
      await deleteJob(token, id);
      setJobs((prev) => prev.filter((job) => job.id !== id));
      setConfirmDeleteId(null);
      toast.success("Role deleted from your board.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete job");
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

              <div className="calendar-inline-block">
                <p className="calendar-inline-title">Upcoming test / deadline (optional)</p>
                <label>
                  Category
                  <select
                    value={eventCategory}
                    onChange={(event) =>
                      setEventCategory(event.target.value as CalendarEventCategory)
                    }
                  >
                    {CALENDAR_CATEGORIES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Date
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(event) => setEventDate(event.target.value)}
                  />
                </label>
                <label>
                  Note
                  <input
                    type="text"
                    value={eventNote}
                    onChange={(event) => setEventNote(event.target.value)}
                    placeholder="Optional — e.g. online English test"
                  />
                </label>
                <p className="muted">
                  Saved events appear on <Link to="/calendar">Calendar</Link>.
                </p>
              </div>

              <button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save role"}
              </button>
            </form>

            {token && eventJobId ? (
              <div className="calendar-inline-followup">
                <CalendarEventForm
                  token={token}
                  jobId={eventJobId}
                  defaultTitle={jobs.find((job) => job.id === eventJobId)?.title ?? ""}
                  compact
                />
              </div>
            ) : null}
          </article>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <div className="panel">
            <h2>Pinned roles</h2>

            {loading ? (
              <ListSkeleton count={3} variant="job" />
            ) : jobs.length === 0 ? (
              <div className="empty-state">
                <strong>No roles yet</strong>
                Add your first internship listing and start building your pipeline.
              </div>
            ) : (
              <ul className="jobs-list">
                {jobs.map((job, index) => {
                  const confirming = confirmDeleteId === job.id;

                  return (
                    <li key={job.id}>
                      <AnimatedCard delay={index * 70} className="job-card-wrap">
                        <article
                          className={`job-card job-card--float${confirming ? " job-card--confirming" : ""}`}
                        >
                          <div className="job-card-header">
                            <div>
                              <h3>{job.title}</h3>
                              <p className="job-meta">
                                {job.company}
                                {job.location ? ` · ${job.location}` : ""}
                              </p>
                            </div>
                            <span className={`status-badge status-badge--${job.status}`}>
                              {job.status}
                            </span>
                          </div>
                          <p className="job-description">{job.description}</p>
                          {confirming ? (
                            <ConfirmCard
                              title="Delete this role?"
                              description="It will leave your board. Linked applications may keep a reference."
                              confirming={deletingId === job.id}
                              onCancel={() => setConfirmDeleteId(null)}
                              onConfirm={() => void handleDelete(job.id)}
                            />
                          ) : (
                            <div className="job-card-footer">
                              <span className="job-date">Added {formatDate(job.created_at)}</span>
                              <button
                                type="button"
                                className="btn-danger"
                                disabled={deletingId !== null}
                                onClick={() => setConfirmDeleteId(job.id)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </article>
                      </AnimatedCard>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </AnimatedCard>
      </div>
    </section>
  );
}
