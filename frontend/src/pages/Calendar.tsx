import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import AnimatedCard from "../components/AnimatedCard";
import CalendarEventForm from "../components/CalendarEventForm";
import { CalendarDaySkeleton, ListSkeleton } from "../components/Skeleton";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../hooks/useAuth";
import { deleteCalendarEvent, listApplications, listCalendarEvents, listJobs } from "../services/api";
import {
  CALENDAR_CATEGORIES,
  getCategoryMeta,
  type CalendarEvent,
} from "../types/calendar";
import type { Application } from "../types/application";
import type { Job } from "../types/job";

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function sameDay(isoDate: string, year: number, month: number, day: number): boolean {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return y === year && m === month + 1 && d === day;
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function CalendarPage() {
  const { token } = useAuth();
  const toast = useToast();
  const today = new Date();
  const [cursor, setCursor] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [loading, setLoading] = useState(true);
  const [linkJobId, setLinkJobId] = useState("");
  const [linkApplicationId, setLinkApplicationId] = useState("");
  const addEventPanelRef = useRef<HTMLElement | null>(null);

  function focusAddEventForm() {
    const panel = addEventPanelRef.current;
    if (!panel) {
      return;
    }
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const focusTarget = panel.querySelector<HTMLElement>(
      "select, input:not([type='hidden']), textarea, button[type='submit']",
    );
    focusTarget?.focus();
  }

  const loadMonth = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    try {
      const [monthEvents, jobData, applicationData] = await Promise.all([
        listCalendarEvents(token, { year: cursor.year, month: cursor.month + 1 }),
        listJobs(token),
        listApplications(token),
      ]);
      setEvents(monthEvents);
      setJobs(jobData);
      setApplications(applicationData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load calendar");
    } finally {
      setLoading(false);
    }
  }, [token, cursor.year, cursor.month, toast]);

  useEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  useEffect(() => {
    const maxDay = daysInMonth(cursor.year, cursor.month);
    setSelectedDay((prev) => {
      if (prev == null) {
        return 1;
      }
      return Math.min(prev, maxDay);
    });
  }, [cursor.year, cursor.month]);

  const firstWeekday = startOfMonth(cursor.year, cursor.month).getDay();
  const totalDays = daysInMonth(cursor.year, cursor.month);

  const cells = useMemo(() => {
    const leading = Array.from({ length: firstWeekday }, () => null);
    const days = Array.from({ length: totalDays }, (_, index) => index + 1);
    return [...leading, ...days];
  }, [firstWeekday, totalDays]);

  const selectedEvents = useMemo(() => {
    if (selectedDay == null) {
      return [];
    }
    return events.filter((event) =>
      sameDay(event.event_date, cursor.year, cursor.month, selectedDay),
    );
  }, [events, selectedDay, cursor.year, cursor.month]);

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const date = new Date(prev.year, prev.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  async function handleDelete(eventId: number) {
    if (!token) {
      return;
    }
    try {
      await deleteCalendarEvent(token, eventId);
      setEvents((prev) => prev.filter((item) => item.id !== eventId));
      toast.success("Event removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete event");
    }
  }

  const selectedIso =
    selectedDay == null
      ? ""
      : `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

  return (
    <section className="page-section calendar-page">
      <div className="calendar-hero">
        <p className="page-kicker">Deadlines & tests</p>
        <h1>
          Your <em>calendar</em>
        </h1>
      </div>

      <div className="calendar-shell">
        <div className="calendar-controls">
          <div className="calendar-month-nav">
            <button type="button" className="btn-ghost" onClick={() => shiftMonth(-1)}>
              ← Prev
            </button>
            <h2>{monthLabel(cursor.year, cursor.month)}</h2>
            <button type="button" className="btn-ghost" onClick={() => shiftMonth(1)}>
              Next →
            </button>
          </div>

          <div className="calendar-legend">
            {CALENDAR_CATEGORIES.map((item) => (
              <span key={item.value} className="calendar-legend-item">
                <i style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <AnimatedCard className="calendar-grid-card">
          <div className="calendar-grid-wrap panel">
            {loading ? (
              <ListSkeleton variant="calendar" />
            ) : (
              <>
                <div className="calendar-weekdays">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="calendar-grid">
                  {cells.map((day, index) => {
                    if (day == null) {
                      return <div key={`empty-${index}`} className="calendar-cell calendar-cell--empty" />;
                    }
                    const dayEvents = events.filter((event) =>
                      sameDay(event.event_date, cursor.year, cursor.month, day),
                    );
                    const isToday =
                      day === today.getDate() &&
                      cursor.month === today.getMonth() &&
                      cursor.year === today.getFullYear();
                    const isSelected = day === selectedDay;

                    return (
                      <button
                        key={day}
                        type="button"
                        className={`calendar-cell${isToday ? " calendar-cell--today" : ""}${
                          isSelected ? " calendar-cell--selected" : ""
                        }${dayEvents.length ? " calendar-cell--has-events" : ""}`}
                        onClick={() => setSelectedDay(day)}
                      >
                        <span className="calendar-cell-day">{day}</span>
                        <span className="calendar-cell-dots">
                          {dayEvents.slice(0, 4).map((event) => {
                            const meta = getCategoryMeta(event.category);
                            return (
                              <i
                                key={event.id}
                                title={event.title ?? meta.label}
                                style={{ background: meta.color }}
                              />
                            );
                          })}
                        </span>
                        {dayEvents[0] ? (
                          <span className="calendar-cell-preview">{dayEvents[0].title}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </AnimatedCard>

        <div className="calendar-side">
          <AnimatedCard delay={80}>
            <article className="panel">
              <h2>
                {selectedDay
                  ? new Date(cursor.year, cursor.month, selectedDay).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                  : "Pick a day"}
              </h2>

              {loading ? (
                <CalendarDaySkeleton />
              ) : selectedEvents.length === 0 ? (
                <div className="empty-state calendar-day-empty">
                  <strong>Nothing on this day</strong>
                  <p className="empty-state-copy">
                    {selectedDay
                      ? "No deadlines or tests yet — add one below for this date."
                      : "Pick a day on the calendar, then add an event."}
                  </p>
                  {selectedDay ? (
                    <button
                      type="button"
                      className="desk-zone-cta empty-state-cta"
                      onClick={focusAddEventForm}
                    >
                      Add event
                    </button>
                  ) : null}
                </div>
              ) : (
                <ul className="calendar-day-list">
                  {selectedEvents.map((event) => {
                    const meta = getCategoryMeta(event.category);
                    return (
                      <li key={event.id} className="calendar-day-item" style={{ borderColor: meta.color }}>
                        <div className="calendar-day-item-top">
                          <span className="calendar-pill" style={{ background: meta.soft, color: meta.color }}>
                            {meta.label}
                          </span>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => void handleDelete(event.id)}
                          >
                            Remove
                          </button>
                        </div>
                        <strong>{event.title || meta.label}</strong>
                        {(event.job_title || event.job_company) && (
                          <p className="muted">
                            {event.job_title}
                            {event.job_company ? ` · ${event.job_company}` : ""}
                          </p>
                        )}
                        {event.notes ? <p className="calendar-day-notes">{event.notes}</p> : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          </AnimatedCard>

          <AnimatedCard delay={120}>
            <article className="panel panel--form" ref={addEventPanelRef} id="calendar-add-event">
              <h2>Add event</h2>
              <p className="muted">
                Or add while pinning a role on the <Link to="/jobs">Board</Link> / updating the{" "}
                <Link to="/applications">Pipeline</Link>.
              </p>
              <label>
                Link role (optional)
                <select value={linkJobId} onChange={(event) => setLinkJobId(event.target.value)}>
                  <option value="">No role linked</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} · {job.company}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Link application (optional)
                <select
                  value={linkApplicationId}
                  onChange={(event) => setLinkApplicationId(event.target.value)}
                >
                  <option value="">No application linked</option>
                  {applications.map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.job_title} · {application.job_company}
                    </option>
                  ))}
                </select>
              </label>
              {token ? (
                <CalendarEventForm
                  key={selectedIso || "no-day"}
                  token={token}
                  jobId={linkJobId ? Number(linkJobId) : null}
                  applicationId={linkApplicationId ? Number(linkApplicationId) : null}
                  initialDate={selectedIso}
                  defaultTitle=""
                  onCreated={(created) => {
                    if (
                      created.event_date.startsWith(
                        `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`,
                      )
                    ) {
                      setEvents((prev) =>
                        [...prev, created].sort((a, b) => a.event_date.localeCompare(b.event_date)),
                      );
                    }
                  }}
                />
              ) : null}
            </article>
          </AnimatedCard>
        </div>
      </div>
    </section>
  );
}
