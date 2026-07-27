import type { AnalyzeResult, CoverLetterResult } from "../types/agents";

export type AnalyzeHistoryEntry = {
  id: string;
  createdAt: string;
  label: string;
  subtitle?: string;
  result: AnalyzeResult;
};

export type LetterHistoryEntry = {
  id: string;
  createdAt: string;
  label: string;
  subtitle?: string;
  subject_line: string;
  letter: string;
  meta: Pick<
    CoverLetterResult,
    "job_id" | "cv_id" | "application_id" | "rag_chunks_used" | "saved"
  >;
};

const ANALYZE_KEY = "internroute_analyze_history";
const LETTER_KEY = "internroute_letter_history";
const MAX_ENTRIES = 20;

function keyFor(base: string, userId: number | null | undefined): string {
  return userId != null ? `${base}_u${userId}` : base;
}

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, entries: T[]): void {
  localStorage.setItem(key, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function newHistoryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatHistoryTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function loadAnalyzeHistory(userId: number | null | undefined): AnalyzeHistoryEntry[] {
  return read(keyFor(ANALYZE_KEY, userId));
}

export function prependAnalyzeHistory(
  userId: number | null | undefined,
  entry: AnalyzeHistoryEntry,
): AnalyzeHistoryEntry[] {
  const next = [entry, ...loadAnalyzeHistory(userId).filter((item) => item.id !== entry.id)];
  write(keyFor(ANALYZE_KEY, userId), next);
  return next;
}

export function removeAnalyzeHistory(
  userId: number | null | undefined,
  entryId: string,
): AnalyzeHistoryEntry[] {
  const next = loadAnalyzeHistory(userId).filter((item) => item.id !== entryId);
  write(keyFor(ANALYZE_KEY, userId), next);
  return next;
}

export function clearAnalyzeHistory(userId: number | null | undefined): void {
  localStorage.removeItem(keyFor(ANALYZE_KEY, userId));
}

export function loadLetterHistory(userId: number | null | undefined): LetterHistoryEntry[] {
  return read(keyFor(LETTER_KEY, userId));
}

export function prependLetterHistory(
  userId: number | null | undefined,
  entry: LetterHistoryEntry,
): LetterHistoryEntry[] {
  const next = [entry, ...loadLetterHistory(userId).filter((item) => item.id !== entry.id)];
  write(keyFor(LETTER_KEY, userId), next);
  return next;
}

export function updateLetterHistoryEntry(
  userId: number | null | undefined,
  entryId: string,
  patch: Partial<Pick<LetterHistoryEntry, "subject_line" | "letter">>,
): LetterHistoryEntry[] {
  const next = loadLetterHistory(userId).map((item) =>
    item.id === entryId ? { ...item, ...patch } : item,
  );
  write(keyFor(LETTER_KEY, userId), next);
  return next;
}

export function removeLetterHistory(
  userId: number | null | undefined,
  entryId: string,
): LetterHistoryEntry[] {
  const next = loadLetterHistory(userId).filter((item) => item.id !== entryId);
  write(keyFor(LETTER_KEY, userId), next);
  return next;
}

export function clearLetterHistory(userId: number | null | undefined): void {
  localStorage.removeItem(keyFor(LETTER_KEY, userId));
}
