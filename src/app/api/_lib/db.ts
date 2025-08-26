import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const DB_PATH = process.env.SQLITE_PATH ?? path.join(process.cwd(), 'data', 'convospark.db')

const dir = path.dirname(DB_PATH)
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const db = new Database(DB_PATH)

db.exec(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS transcripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  speaker TEXT,
  text TEXT,
  ts TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);
CREATE INDEX IF NOT EXISTS idx_transcripts_session ON transcripts(session_id);
CREATE TABLE IF NOT EXISTS provider_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  account_id TEXT,
  token TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_provider_account ON provider_tokens(provider, account_id);
`)

export function createSessionIfNotExists(sessionId: string) {
  if (!sessionId) return
  const st = db.prepare('INSERT OR IGNORE INTO sessions(id) VALUES(?)')
  st.run(sessionId)
}

export function addTranscript(sessionId: string, speaker: string | null | undefined, text: string, ts?: string) {
  createSessionIfNotExists(sessionId)
  const st = db.prepare('INSERT INTO transcripts(session_id, speaker, text, ts) VALUES(?,?,?,COALESCE(?, datetime(\'now\')))')
  st.run(sessionId, speaker ?? null, text, ts ?? null)
}

export function getTranscripts(sessionId: string) {
  const st = db.prepare('SELECT id, session_id, speaker, text, ts FROM transcripts WHERE session_id = ? ORDER BY id ASC')
  return st.all(sessionId)
}

export function listSessions() {
  const st = db.prepare('SELECT id, created_at FROM sessions ORDER BY created_at DESC')
  return st.all()
}

export function saveProviderToken(provider: string, accountId: string | null | undefined, tokenObj: object | string) {
  const tokenText = typeof tokenObj === 'string' ? tokenObj : JSON.stringify(tokenObj)
  const st = db.prepare('INSERT INTO provider_tokens(provider, account_id, token) VALUES(?,?,?)')
  st.run(provider, accountId ?? null, tokenText)
}

export function getProviderToken(provider: string, accountId: string | null | undefined) {
  const st = db.prepare('SELECT id, provider, account_id, token, created_at FROM provider_tokens WHERE provider = ? AND account_id IS ? ORDER BY id DESC LIMIT 1')
  return st.get(provider, accountId ?? null)
}

export default db
