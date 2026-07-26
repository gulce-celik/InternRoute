export interface CV {
  id: number;
  name: string;
  filename: string;
  created_at: string;
}

export interface CVUploadResult extends CV {}
