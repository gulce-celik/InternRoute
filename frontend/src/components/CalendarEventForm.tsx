import { useEffect, useState, type FormEvent } from "react";

import { useToast } from "./ToastProvider";
import { createCalendarEvent } from "../services/api";
import {
  CALENDAR_CATEGORIES,
  type CalendarEvent,
  type CalendarEventCategory,
} from "../types/calendar";

type Props = {
  token: string;
  jobId?: number | null;
  applicationId?: number | null;
  defaultTitle?: string;
  initialDate?: string;
  onCreated?: (event: CalendarEvent) => void;
  compact?: boolean;
};

export default function CalendarEventForm({
  token,
  jobId = null,
  applicationId = null,
  defaultTitle = "",
  initialDate = "",
  onCreated,
  compact = false,
}: Props) {
  const toast = useToast();
  const [category, setCategory] = useState<CalendarEventCategory>("hr_interview");
  const [eventDate, setEventDate] = useState(initialDate);
  const [title, setTitle] = useState(defaultTitle);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialDate) {
      setEventDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    setTitle(defaultTitle);
  }, [defaultTitle]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!eventDate) {
      toast.error("Pick a date for this deadline.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createCalendarEvent(token, {
        category,
        event_date: eventDate,
        title: title.trim() || null,
        notes: notes.trim() || null,
        job_id: jobId ?? null,
        application_id: applicationId ?? null,
      });
      setEventDate("");
      setNotes("");
      setTitle(defaultTitle);
      toast.success("Saved to Calendar.");
      onCreated?.(created);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save calendar event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className={`calendar-event-form${compact ? " calendar-event-form--compact" : ""}`}>
      <div className="calendar-event-form-head">
        <strong>Add deadline / test</strong>
        <span className="muted">Shows up on Calendar</span>
      </div>

      <label>
        Category
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as CalendarEventCategory)}
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
          required
        />
      </label>

      <label>
        Label (optional)
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Getir English test"
        />
      </label>

      {!compact ? (
        <label>
          Notes (optional)
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            placeholder="Zoom link, room, prep notes…"
          />
        </label>
      ) : null}

      <button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Add to Calendar"}
      </button>
    </form>
  );
}
