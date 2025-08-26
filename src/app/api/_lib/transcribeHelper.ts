import { appendTranscript } from './session'
import { publish } from './bus'

export async function doTranscribe(sessionId: string, blob: Blob, speaker?: string | null) {
  let text = `Spoke at ${new Date().toISOString()}`
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (OPENAI_API_KEY) {
    try {
      const form = new FormData()
      form.append('file', blob, 'audio.webm')
      form.append('model', 'whisper-1')
      const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }, body: form as unknown as BodyInit })
      const data = await resp.json()
      if (data?.text) text = data.text
    } catch (e) {
      console.error('transcribe error', e)
    }
  }

  await appendTranscript(sessionId, text, speaker ?? undefined, new Date().toISOString())
  publish(sessionId, `${speaker ? speaker + ': ' : ''}${text}`)
  return text
}
