export type AnalyzeRequest = {
  job_id?: number;
  cv_id?: number;
  application_id?: number;
};

export type AnalyzeResult = {
  job_id: number;
  cv_id: number;
  application_id: number | null;
  fit_score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  keywords_to_add: string[];
  recommendations: string[];
  rag_chunks_used: number;
};

export type CoverLetterRequest = {
  job_id?: number;
  cv_id?: number;
  application_id?: number;
  analysis_summary?: string;
  notes?: string;
  tone?: string;
  save?: boolean;
};

export type CoverLetterResult = {
  job_id: number;
  cv_id: number;
  application_id: number | null;
  subject_line: string;
  letter: string;
  rag_chunks_used: number;
  saved: boolean;
};
