import { NextResponse } from 'next/server'

// Simple Zoom forwarder. Expects JSON: { recordingUrl?: string, participantFiles?: [{url, participant}], sessionId }
// If participantFiles are provided, forward each to /api/ingest with speaker metadata.
// If only recordingUrl is provided, fallback to /api/diarize which will split audio.

interface ParticipantFile { url: string; participant?: string; speaker?: string }

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid json' }, { status: 400 })

  const sessionId = body.sessionId || 'default'

  try {
    if (Array.isArray(body.participantFiles) && body.participantFiles.length > 0) {
      // forward each file
    const parts = body.participantFiles as ParticipantFile[]
    await Promise.all(parts.map(async (p) => {
        try {
          const r = await fetch(p.url)
          const buf = await r.arrayBuffer()
          const fd = new FormData()
          fd.append('audio', new Blob([buf], { type: 'audio/webm' }), 'audio.webm')
          fd.append('sessionId', sessionId)
      fd.append('speaker', p.participant || p.speaker || 'Unknown')
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/ingest`, { method: 'POST', body: fd })
        } catch (e) { console.error('forward part failed', e) }
      }))
      return NextResponse.json({ ok: true, forwarded: body.participantFiles.length })
    }

    if (body.recordingUrl) {
      // fetch and send to diarize endpoint
      const r = await fetch(body.recordingUrl)
      const buf = await r.arrayBuffer()
      const fd = new FormData()
      fd.append('audio', new Blob([buf], { type: 'audio/webm' }), 'audio.webm')
      fd.append('sessionId', sessionId)
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/diarize`, { method: 'POST', body: fd })
      return NextResponse.json({ ok: true, forwarded: 'diarize' })
    }

    return NextResponse.json({ error: 'no files provided' }, { status: 400 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
