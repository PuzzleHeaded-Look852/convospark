import { NextResponse } from 'next/server'

// Zoom will POST JSON webhooks here. In prod verify tokens and event types.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid json' }, { status: 400 })

  // Example verification: Zoom sends an "authorization" header or a verification token in the payload
  // TODO: verify using your Zoom App credentials

  // Handle a subset of events quickly
  const event = body.event || body.event_type || 'unknown'
  console.log('zoom webhook received', event)

  // Persist or enqueue for processing (mock)
  // For example: if event === 'recording.completed' then fetch recording file and process

  return NextResponse.json({ ok: true })
}

export async function GET() {
  // simple health check
  return NextResponse.json({ ok: true })
}
