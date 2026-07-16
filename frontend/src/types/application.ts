export type ApplicationStatus = "draft" | "applied" | "interview" | "offer" | "rejected";

export interface ApplicationQAItem {
  question: string;
  answer: string;
}

export interface Application {
  id: number;
  job_id: number;
  cv_id: number | null;
  status: ApplicationStatus;
  notes: string | null;
  qa_items: ApplicationQAItem[];
  created_at: string;
  job_title: string;
  job_company: string;
  cv_filename: string | null;
}

export interface ApplicationCreate {
  job_id: number;
  cv_id?: number | null;
  status?: ApplicationStatus;
  notes?: string | null;
  qa_items?: ApplicationQAItem[];
}

export interface ApplicationUpdate {
  status?: ApplicationStatus;
  cv_id?: number | null;
  notes?: string | null;
  qa_items?: ApplicationQAItem[];
}
