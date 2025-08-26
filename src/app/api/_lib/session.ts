export type Transcript = {
  id?: number;
  text: string;
  speaker?: string;
  timestamp?: string;
};

export type Session = {
  id: string;
  transcripts: Transcript[];
};

// Database-backed session helpers (SQLite via better-sqlite3)
import { createSessionIfNotExists, addTranscript, getTranscripts, listSessions, saveProviderToken, getProviderToken } from './db'

export async function appendTranscript(sessionId: string, text: string, speaker?: string | null, ts?: string) {
  if (!sessionId) throw new Error('sessionId required')
  createSessionIfNotExists(sessionId)
  addTranscript(sessionId, speaker ?? undefined, text, ts ?? undefined)
}

export async function fetchTranscripts(sessionId: string): Promise<Transcript[]> {
  if (!sessionId) return []
  return getTranscripts(sessionId) as Transcript[]
}

export async function fetchSessions() {
  return listSessions()
}

export async function persistProviderToken(provider: string, accountId: string | null | undefined, tokenObj: object | string) {
  saveProviderToken(provider, accountId, tokenObj)
}

export async function loadProviderToken(provider: string, accountId: string | null | undefined) {
  return getProviderToken(provider, accountId)
}
