import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite'
import { drizzle } from 'drizzle-orm/sqlite-proxy'
import migrationSql from './migrations/0000_elite_snowbird.sql?raw'
import * as schema from './schema'

const DB_NAME = 'couponkeeper'

const sqliteConnection = new SQLiteConnection(CapacitorSQLite)
let connectionPromise: Promise<SQLiteDBConnection> | null = null
let webStoreReady: Promise<void> | null = null

/**
 * The native plugin ships its own SQLite; the web platform has none, so it
 * falls back to the `jeep-sqlite` custom element (sql.js under the hood).
 * The element itself is registered once in main.ts — this just waits for it
 * and points the connection at its IndexedDB-backed store.
 */
async function ensureWebStore(): Promise<void> {
  if (Capacitor.getPlatform() !== 'web') return
  if (!webStoreReady) {
    webStoreReady = customElements.whenDefined('jeep-sqlite').then(() => sqliteConnection.initWebStore())
  }
  return webStoreReady
}

/**
 * There's no migration runner wired up yet (see CLAUDE.md's Testing/OpenSpec
 * notes on the stack still being bootstrapped) — this just applies the single
 * generated migration once, guarded by whether `coupons` already exists.
 *
 * Statements are split and run one at a time rather than handing the whole
 * multi-statement file to a single `conn.execute()` call: on native Android,
 * the plugin's own statement splitter garbles it — verified on-device, it
 * concatenates a `CREATE INDEX` with the following `CREATE TABLE` into one
 * chunk (whenever drizzle-kit's `--> statement-breakpoint` marker lands on
 * the same line as the preceding `;`, e.g. `);--> statement-breakpoint`) and
 * throws "no such table" for a table that hadn't been created yet. Running
 * one statement per `execute()` call sidesteps that splitter entirely.
 */
async function ensureSchema(conn: SQLiteDBConnection): Promise<void> {
  const { values } = await conn.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'coupons'")
  if (values && values.length > 0) return

  const statements = migrationSql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)

  for (const statement of statements) {
    await conn.execute(statement)
  }
}

async function openConnection(): Promise<SQLiteDBConnection> {
  await ensureWebStore()

  const { result: isConn } = await sqliteConnection.isConnection(DB_NAME, false)
  const connection = isConn
    ? await sqliteConnection.retrieveConnection(DB_NAME, false)
    : await sqliteConnection.createConnection(DB_NAME, false, 'no-encryption', 1, false)

  await connection.open()
  await ensureSchema(connection)
  return connection
}

/**
 * Every statement (seeding at boot, a list query, a form save, ...) calls
 * this independently, and on app boot several of those genuinely happen
 * concurrently. Caching the in-flight *promise* (not just the resolved
 * connection) makes concurrent callers share one connection attempt instead
 * of each racing to call `createConnection` for the same db name — the
 * native plugin throws "connection already exists" on the loser, which
 * silently killed both seeding and saving before this was single-flighted.
 * On failure the cached promise is cleared so the next call can retry.
 */
function getConnection(): Promise<SQLiteDBConnection> {
  if (!connectionPromise) {
    connectionPromise = openConnection().catch((error: unknown) => {
      connectionPromise = null
      throw error
    })
  }
  return connectionPromise
}

/**
 * Runs `task`s one at a time, in submission order, regardless of how many
 * come in concurrently. Every statement (seeding, a list query, a form save,
 * ...) goes through the single connection below, and issuing two statements
 * to it concurrently — e.g. boot-time seeding overlapping the first list
 * load, both of which genuinely happen on every cold start — either hung
 * forever or corrupted results, on both the web fallback and native. A
 * single shared SQLite connection is not safe for concurrent statements;
 * queueing makes every caller wait its turn instead.
 */
let queueTail: Promise<unknown> = Promise.resolve()
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queueTail.then(task, task)
  queueTail = result.then(
    () => undefined,
    () => undefined
  )
  return result
}

/**
 * Drizzle's sqlite-proxy driver defers every statement to this callback, so
 * the plugin's async, object-row API (`{ values: Record<string, unknown>[] }`)
 * is where it plugs into Drizzle's array-row protocol.
 */
export const db = drizzle(
  (sqlStatement, params, method) =>
    enqueue(async () => {
      const conn = await getConnection()

      if (method === 'run') {
        await conn.run(sqlStatement, params, false)
        return { rows: [] }
      }

      const result = await conn.query(sqlStatement, params)
      const rows = (result.values ?? []).map((row) => Object.values(row))
      return { rows }
    }),
  { schema }
)

/** Closes the underlying native/web connection. Mainly useful for tests. */
export async function closeDb(): Promise<void> {
  if (!connectionPromise) return
  connectionPromise = null
  await sqliteConnection.closeConnection(DB_NAME, false)
}
