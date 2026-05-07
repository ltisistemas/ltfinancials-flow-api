export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  user_metadata?: {
    name?: string;
  };
}
