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

export type MockInterviewStartRequest = {
  job_id?: number;
  cv_id?: number;
  application_id?: number;
  question_limit?: number;
};

export type MockInterviewStartResult = {
  session_id: number;
  job_id: number;
  cv_id: number;
  application_id: number | null;
  status: string;
  question_index: number;
  question_limit: number;
  question: string;
  rag_chunks_used: number;
};

export type InterviewSummary = {
  overall: string;
  strengths: string[];
  improvements: string[];
  practice_tips: string[];
};

export type MockInterviewAnswerResult = {
  session_id: number;
  status: string;
  question_index: number;
  question_limit: number;
  feedback: string;
  question: string | null;
  completed: boolean;
  summary: InterviewSummary | null;
};

export type InterviewTurn = {
  role: string;
  content: string;
  feedback: string | null;
  created_at: string | null;
};

export type MockInterviewSession = {
  session_id: number;
  job_id: number;
  cv_id: number;
  application_id: number | null;
  job_title: string;
  job_company: string;
  status: string;
  question_index: number;
  question_limit: number;
  transcript: InterviewTurn[];
  summary: InterviewSummary | null;
  created_at: string | null;
  updated_at: string | null;
};

export type MockInterviewSessionListItem = {
  session_id: number;
  job_id: number;
  cv_id: number;
  application_id: number | null;
  job_title: string;
  job_company: string;
  status: string;
  question_limit: number;
  created_at: string | null;
};
