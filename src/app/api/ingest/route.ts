import { NextResponse } from 'next/server'
import { doTranscribe } from '../_lib/transcribeHelper'

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'expected formdata' }, { status: 400 })
  const audio = form.get('audio') as Blob | null
  const sessionId = (form.get('sessionId') as string) || 'default'
  const speaker = (form.get('speaker') as string) || undefined
  if (!audio) return NextResponse.json({ error: 'missing audio' }, { status: 400 })

  try {
    const text = await doTranscribe(sessionId, audio as Blob, speaker)
    return NextResponse.json({ ok: true, text })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
