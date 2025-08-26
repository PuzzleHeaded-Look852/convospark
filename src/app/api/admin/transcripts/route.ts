import { NextResponse } from 'next/server'
import { fetchTranscripts } from '../../_lib/session'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId') || ''
  if (!sessionId) return NextResponse.json({ error: 'missing sessionId' }, { status: 400 })

  try {
    const rows = await fetchTranscripts(sessionId)
    return NextResponse.json({ transcripts: rows })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
