export interface User {
  id: number;
  email: string;
  full_name: string | null;
  university?: string | null;
  study_year?: number | null;
  major?: string | null;
  target_sectors?: string | null;
}

export interface ProfileUpdate {
  full_name?: string;
  university?: string;
  study_year?: number;
  major?: string;
  target_sectors?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name?: string;
}
