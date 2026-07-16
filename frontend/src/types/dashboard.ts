export interface DashboardStats {
  job_count: number;
  cv_count: number;
  application_count: number;
  interview_count: number;
  offer_count: number;
  furthest_pipeline_stage: "saved" | "applied" | "interview" | "offer";
}

export interface MemoryChunk {
  source: string;
  snippet: string;
}

export interface MemoryContext {
  cv_chunks: number;
  snippets: MemoryChunk[];
}
