import type {
  AnalyzeRequest,
  AnalyzeResult,
  CoverLetterRequest,
  CoverLetterResult,
  MockInterviewAnswerResult,
  MockInterviewSession,
  MockInterviewSessionListItem,
  MockInterviewStartRequest,
  MockInterviewStartResult,
} from "../types/agents";
import type { Application, ApplicationCreate, ApplicationUpdate } from "../types/application";
import type {
  ProfileUpdate,
  RegisterPayload,
  RegisterVerifyPayload,
  TokenResponse,
  User,
  VerificationStarted,
} from "../types/auth";
import type { CalendarEvent, CalendarEventCreate } from "../types/calendar";
import type { DashboardStats, MemoryContext } from "../types/dashboard";
import type { CV } from "../types/cv";
import type { Job, JobCreate, JobUpdate } from "../types/job";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

function parseErrorDetail(detail: unknown): string {
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (typeof item === "object" && item && "msg" in item ? String(item.msg) : "Validation error"))
      .join(", ");
  }
  return "Request failed";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { headers: optionHeaders, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(optionHeaders ?? {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(parseErrorDetail(error.detail));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function authRequest<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

export async function startRegistration(payload: RegisterPayload): Promise<VerificationStarted> {
  return request<VerificationStarted>("/auth/register/start", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyRegistration(payload: RegisterVerifyPayload): Promise<User> {
  return request<User>("/auth/register/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resendRegistrationCode(email: string): Promise<VerificationStarted> {
  return request<VerificationStarted>("/auth/register/resend", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function loginUser(email: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    username: email,
    password,
  });

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(error.detail ?? "Login failed");
  }

  return response.json() as Promise<TokenResponse>;
}

export async function getCurrentUser(token: string): Promise<User> {
  return authRequest<User>("/auth/me", token);
}

export async function getProfile(token: string): Promise<User> {
  return authRequest<User>("/profile", token);
}

export async function updateProfile(token: string, payload: ProfileUpdate): Promise<User> {
  return authRequest<User>("/profile", token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function listJobs(token: string): Promise<Job[]> {
  return authRequest<Job[]>("/jobs", token);
}

export async function createJob(token: string, payload: JobCreate): Promise<Job> {
  return authRequest<Job>("/jobs", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateJob(token: string, id: number, payload: JobUpdate): Promise<Job> {
  return authRequest<Job>(`/jobs/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteJob(token: string, id: number): Promise<void> {
  await authRequest<void>(`/jobs/${id}`, token, { method: "DELETE" });
}

export async function listCVs(token: string): Promise<CV[]> {
  return authRequest<CV[]>("/cvs", token);
}

export async function uploadCV(token: string, file: File, name?: string): Promise<CV> {
  const formData = new FormData();
  formData.append("file", file);
  const trimmed = name?.trim();
  if (trimmed) {
    formData.append("name", trimmed);
  }

  const response = await fetch(`${API_BASE_URL}/cvs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(parseErrorDetail(error.detail));
  }

  return response.json() as Promise<CV>;
}

export async function deleteCV(token: string, id: number): Promise<void> {
  await authRequest<void>(`/cvs/${id}`, token, { method: "DELETE" });
}

export async function openCVFile(token: string, id: number, filename: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/cvs/${id}/file`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Could not open CV" }));
    throw new Error(parseErrorDetail(error.detail));
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const tab = window.open(url, "_blank", "noopener,noreferrer");
  if (!tab) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function listApplications(token: string): Promise<Application[]> {
  return authRequest<Application[]>("/applications", token);
}

export async function createApplication(
  token: string,
  payload: ApplicationCreate,
): Promise<Application> {
  return authRequest<Application>("/applications", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateApplicationStatus(
  token: string,
  id: number,
  status: ApplicationCreate["status"],
): Promise<Application> {
  return authRequest<Application>(`/applications/${id}/status`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function updateApplication(
  token: string,
  id: number,
  payload: ApplicationUpdate,
): Promise<Application> {
  return authRequest<Application>(`/applications/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getDashboardStats(token: string): Promise<DashboardStats> {
  return authRequest<DashboardStats>("/dashboard/stats", token);
}

export async function getMemoryContext(token: string): Promise<MemoryContext> {
  return authRequest<MemoryContext>("/memory/context", token);
}

export async function analyzeJobCv(token: string, payload: AnalyzeRequest): Promise<AnalyzeResult> {
  return authRequest<AnalyzeResult>("/agents/analyze", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateCoverLetter(
  token: string,
  payload: CoverLetterRequest,
): Promise<CoverLetterResult> {
  return authRequest<CoverLetterResult>("/agents/cover-letter", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function startMockInterview(
  token: string,
  payload: MockInterviewStartRequest,
): Promise<MockInterviewStartResult> {
  return authRequest<MockInterviewStartResult>("/agents/mock-interview/start", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function answerMockInterview(
  token: string,
  payload: { session_id: number; answer: string },
): Promise<MockInterviewAnswerResult> {
  return authRequest<MockInterviewAnswerResult>("/agents/mock-interview/answer", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMockInterview(
  token: string,
  sessionId: number,
): Promise<MockInterviewSession> {
  return authRequest<MockInterviewSession>(`/agents/mock-interview/${sessionId}`, token);
}

export async function listMockInterviews(
  token: string,
  limit = 20,
): Promise<MockInterviewSessionListItem[]> {
  const search = new URLSearchParams({ limit: String(limit) });
  return authRequest<MockInterviewSessionListItem[]>(`/agents/mock-interview?${search}`, token);
}

export async function deleteMockInterview(token: string, sessionId: number): Promise<void> {
  await authRequest<void>(`/agents/mock-interview/${sessionId}`, token, {
    method: "DELETE",
  });
}

export async function clearMockInterviews(token: string): Promise<void> {
  await authRequest<void>("/agents/mock-interview", token, {
    method: "DELETE",
  });
}

export async function listCalendarEvents(
  token: string,
  params?: { year?: number; month?: number },
): Promise<CalendarEvent[]> {
  const search = new URLSearchParams();
  if (params?.year != null) {
    search.set("year", String(params.year));
  }
  if (params?.month != null) {
    search.set("month", String(params.month));
  }
  const query = search.toString();
  return authRequest<CalendarEvent[]>(`/calendar/events${query ? `?${query}` : ""}`, token);
}

export async function createCalendarEvent(
  token: string,
  payload: CalendarEventCreate,
): Promise<CalendarEvent> {
  return authRequest<CalendarEvent>("/calendar/events", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteCalendarEvent(token: string, id: number): Promise<void> {
  await authRequest<void>(`/calendar/events/${id}`, token, { method: "DELETE" });
}
