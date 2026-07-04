import type { ProfileUpdate, RegisterPayload, TokenResponse, User } from "../types/auth";
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

export async function registerUser(payload: RegisterPayload): Promise<User> {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
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
