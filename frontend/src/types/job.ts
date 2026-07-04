export interface Job {
  id: number;
  title: string;
  company: string;
  description: string;
  location: string | null;
  status: string;
  created_at: string;
}

export interface JobCreate {
  title: string;
  company: string;
  description: string;
  location?: string;
  status?: string;
}

export interface JobUpdate {
  title?: string;
  company?: string;
  description?: string;
  location?: string;
  status?: string;
}
