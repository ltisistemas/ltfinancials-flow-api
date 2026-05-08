export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  name?: string;
  role?: string;
  user_metadata?: {
    name?: string;
  };
}
