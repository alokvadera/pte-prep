export interface Env {
  DB: D1Database
  JWT_SECRET: string
  CORS_ORIGIN?: string
  BREVO_API_KEY?: string
  BREVO_SENDER_EMAIL?: string
  BREVO_SENDER_NAME?: string
  SITE_ORIGIN?: string
  SESSION_EXPIRY_SECONDS?: string
  PBKDF2_ITERATIONS?: string
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
  iat?: number
  jti?: string
  aud?: string
}
