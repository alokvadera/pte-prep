export interface Env {
  DB: D1Database
  JWT_SECRET: string
  CORS_ORIGIN?: string
}

export interface UserRecord {
  id: string
  email: string
  target_score: number
  created_at: string
  updated_at: string
}

export interface AuthSession {
  userId: string
  email: string
  exp: number
}
