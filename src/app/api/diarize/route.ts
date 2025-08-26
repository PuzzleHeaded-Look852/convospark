import { NextResponse } from 'next/server'
import { diarizeAndTranscribe } from '../_lib/diarizeHelper'

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'expected formdata' }, { status: 400 })
  const audio = form.get('audio') as Blob | null
  const sessionId = (form.get('sessionId') as string) || 'default'
  if (!audio) return NextResponse.json({ error: 'missing audio' }, { status: 400 })

  try {
    const res = await diarizeAndTranscribe(sessionId, audio as Blob)
    return NextResponse.json({ ok: true, parts: res })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
