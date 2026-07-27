export type CalendarEventCategory =
  | "aptitude_test"
  | "ai_interview"
  | "language_test"
  | "hr_interview"
  | "technical_interview"
  | "team_interview"
  | "case_study";

export type CalendarEvent = {
  id: number;
  category: CalendarEventCategory;
  event_date: string;
  title: string | null;
  notes: string | null;
  job_id: number | null;
  application_id: number | null;
  job_title: string | null;
  job_company: string | null;
  created_at: string;
};

export type CalendarEventCreate = {
  category: CalendarEventCategory;
  event_date: string;
  title?: string | null;
  notes?: string | null;
  job_id?: number | null;
  application_id?: number | null;
};

export const CALENDAR_CATEGORIES: {
  value: CalendarEventCategory;
  label: string;
  color: string;
  soft: string;
}[] = [
  { value: "aptitude_test", label: "Aptitude test", color: "#2f6fed", soft: "#dbe7ff" },
  { value: "ai_interview", label: "AI interview", color: "#7c3aed", soft: "#ede9fe" },
  { value: "language_test", label: "Language test", color: "#0f766e", soft: "#ccfbf1" },
  { value: "hr_interview", label: "HR interview", color: "#c84b31", soft: "#fde8e2" },
  { value: "technical_interview", label: "Technical interview", color: "#b45309", soft: "#ffedd5" },
  { value: "team_interview", label: "Team interview", color: "#1d4ed8", soft: "#dbeafe" },
  { value: "case_study", label: "Case study", color: "#be185d", soft: "#fce7f3" },
];

export function getCategoryMeta(category: CalendarEventCategory) {
  return (
    CALENDAR_CATEGORIES.find((item) => item.value === category) ?? {
      value: category,
      label: category,
      color: "#4a433c",
      soft: "#efe6d8",
    }
  );
}
