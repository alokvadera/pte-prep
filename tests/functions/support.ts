/* ---------------------------------------------------------------------------
   Shared helpers for the Cloudflare Pages Functions tests.

   Nothing here is a test: it is the small amount of scaffolding every test
   file needs — a `Env`, an `ExecutionContext`-shaped context object, request
   builders, and a way to inject faults into the in-memory D1 so the
   "the database is down" branches can be reached.
   --------------------------------------------------------------------------- */

import './webcrypto'

import type { Env } from '../../functions/types'
import type { AttemptRow, D1Mock, ResetRow, SessionRow, UserRow } from './d1'
import { createSessionToken, hashPassword } from '../../functions/lib/auth'

/** A signing secret long enough for `requireSecret` to accept it. */
export const SECRET = 'a-test-secret-that-is-at-least-32-characters-long'

/** The origin every synthesised request is made against. */
export const BASE_URL = 'https://site.test'

/** The PBKDF2 cost used by the seeded fixtures, and by the test environments. */
export const TEST_ITERATIONS = 10_000

/**
 * The context shape a `PagesFunction` receives. Derived from the handler type
 * itself so the tests stay in step with the real signature.
 */
export type HandlerContext = Parameters<PagesFunction<Env>>[0]

export interface EnvOverrides {
  DB?: D1Database
  JWT_SECRET?: string
  CORS_ORIGIN?: string
  SITE_ORIGIN?: string
  BREVO_API_KEY?: string
  BREVO_SENDER_EMAIL?: string
  BREVO_SENDER_NAME?: string
  SESSION_EXPIRY_SECONDS?: string
  PBKDF2_ITERATIONS?: string
}

/**
 * Builds an `Env`. `DB` is left undefined unless given, which is how the
 * "no database binding" branches are reached.
 */
export function makeEnv(overrides: EnvOverrides = {}): Env {
  const env: Record<string, unknown> = {
    JWT_SECRET: SECRET,
    PBKDF2_ITERATIONS: String(TEST_ITERATIONS),
    ...overrides,
  }
  return env as unknown as Env
}

export interface ContextInit {
  request: Request
  env: Env
  params?: Record<string, string>
  next?: () => Promise<Response>
}

/** Builds the context object a `PagesFunction` is called with. */
export function makeContext(init: ContextInit): HandlerContext {
  return {
    request: init.request,
    env: init.env,
    params: init.params ?? {},
    data: {},
    functionPath: '/api/test',
    waitUntil: () => undefined,
    passThroughOnException: () => undefined,
    next: init.next ?? (async () => new Response(null, { status: 404 })),
  } as unknown as HandlerContext
}

/** A JSON request. `GET` and `HEAD` requests carry no body. */
export function jsonRequest(
  url: string,
  body: unknown,
  method = 'POST',
  headers: Record<string, string> = {},
): Request {
  const carriesBody = method !== 'GET' && method !== 'HEAD'
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    ...(carriesBody ? { body: JSON.stringify(body) } : {}),
  })
}

/** A request whose body is not valid JSON. */
export function rawRequest(
  url: string,
  body: string,
  method = 'POST',
  headers: Record<string, string> = {},
): Request {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body,
  })
}

/** The `Authorization` header for a bearer token. */
export function bearer(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

/** A request with extra headers. */
export function requestWith(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {},
): Request {
  return new Request(url, {
    method: init.method ?? 'GET',
    headers: init.headers ?? {},
    ...(init.body === undefined ? {} : { body: init.body }),
  })
}

/** Reads a JSON response body as a plain record. */
export async function readJson(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>
}

/* ---------------------------------------------------------------------------
   D1 fault injection
   --------------------------------------------------------------------------- */

export interface StatementOverride {
  /** Selects the statements this override applies to. */
  match: (sql: string) => boolean
  run?: () => Promise<D1Result>
  first?: () => Promise<unknown>
  all?: () => Promise<{ results: unknown[] }>
}

interface FakeStatement {
  bind: (...args: unknown[]) => FakeStatement
  run: () => Promise<D1Result>
  first: () => Promise<unknown>
  all: () => Promise<{ results: unknown[] }>
  raw: () => Promise<unknown[]>
}

const OK_RESULT = {
  success: true,
  meta: {
    changes: 1,
    last_row_id: 0,
    duration: 0,
    rows_read: 0,
    rows_written: 1,
    size_after: 0,
    changed_db: false,
  },
} as unknown as D1Result

/**
 * Wraps a D1 database so that the statements matching an override answer
 * differently. This is how the failure branches — a database that throws, an
 * upsert that returns no row, a cleanup that fails — are reached.
 */
export function withOverrides(db: D1Database, overrides: StatementOverride[]): D1Database {
  const originalPrepare = db.prepare.bind(db)
  const wrapped = {
    exec: db.exec.bind(db),
    batch: db.batch.bind(db),
    prepare: (sql: string) => {
      const override = overrides.find((candidate) => candidate.match(sql))
      if (!override) return originalPrepare(sql)
      const statement: FakeStatement = {
        bind: () => statement,
        run: async () => (override.run ? override.run() : OK_RESULT),
        first: async () => (override.first ? override.first() : null),
        all: async () => (override.all ? override.all() : { results: [] }),
        raw: async () => [],
      }
      return statement
    },
  }
  return wrapped as unknown as D1Database
}

/* ---------------------------------------------------------------------------
   Fixtures
   --------------------------------------------------------------------------- */

export interface SeededUser {
  row: UserRow
  password: string
}

/**
 * Creates a user with a real PBKDF2 hash of `password`, so the login and
 * password-change paths can be exercised for real.
 */
export async function seedUser(
  mock: D1Mock,
  options: { id?: string; email: string; password: string; targetScore?: number },
): Promise<SeededUser> {
  const { hash, salt } = await hashPassword(options.password, TEST_ITERATIONS)
  const row: UserRow = {
    id: options.id ?? `usr_${options.email.replace(/[^a-z0-9]/gi, '_')}`,
    email: options.email,
    password_hash: hash,
    password_salt: salt,
    target_score: options.targetScore ?? 65,
    created_at: new Date().toISOString(),
  }
  mock.users.set(row.id, row)
  return { row, password: options.password }
}

/** Builds an attempt row with sensible defaults. */
export function makeAttemptRow(overrides: Partial<AttemptRow> = {}): AttemptRow {
  return {
    id: 'attempt_0001',
    user_id: 'usr_1',
    mock_id: 'mock-1',
    mock_title: 'Mock Test 1',
    mode: 'full',
    started_at: '2024-01-01T00:00:00.000Z',
    finished_at: '2024-01-01T01:00:00.000Z',
    duration_ms: 3_600_000,
    overall_score: 68,
    cefr: 'B2',
    earned_points: 45,
    available_points: 60,
    skill_scores: '{}',
    breakdown: '{}',
    responses: null,
    synced_at: '2024-01-01T01:00:00.000Z',
    ...overrides,
  }
}

/** Adds an attempt to the mock database. */
export function seedAttempt(mock: D1Mock, row: AttemptRow): AttemptRow {
  mock.attempts.set(row.id, row)
  return row
}

/** Adds a session row to the mock database. */
export function seedSession(mock: D1Mock, row: SessionRow): SessionRow {
  mock.sessions.set(row.jti, row)
  return row
}

/** Adds a password reset row to the mock database. */
export function seedReset(mock: D1Mock, row: ResetRow): ResetRow {
  mock.resets.set(row.token_hash, row)
  return row
}

/**
 * Creates a signed session token and records the matching session row, which
 * is what `verifySessionToken` looks for when a database is supplied.
 */
export async function createSession(
  mock: D1Mock,
  options: { userId: string; email: string; expiresInSeconds?: number },
): Promise<string> {
  return createSessionToken(
    { userId: options.userId, email: options.email },
    SECRET,
    options.expiresInSeconds ?? 3600,
    mock.db,
  )
}

/**
 * Creates a signed session token without recording a session row. Used for
 * the paths that check the database binding after the session is verified.
 */
export async function createToken(
  options: { userId: string; email: string; expiresInSeconds?: number },
): Promise<string> {
  return createSessionToken(
    { userId: options.userId, email: options.email },
    SECRET,
    options.expiresInSeconds ?? 3600,
  )
}

/** Seconds since the epoch, as the handlers compute it. */
export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

/** Waits for the given number of milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
