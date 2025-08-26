import { NextResponse } from 'next/server'
import { fetchSessions } from '../../_lib/session'

export async function GET() {
  try {
    const rows = await fetchSessions()
    return NextResponse.json({ sessions: rows })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
