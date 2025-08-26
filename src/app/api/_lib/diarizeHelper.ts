import fs from 'fs'
import os from 'os'
import path from 'path'
import { promisify } from 'util'
import { exec as _exec } from 'child_process'
import { doTranscribe } from './transcribeHelper'

const exec = promisify(_exec)

// Naive diarization fallback: split audio into fixed-length segments using ffmpeg
// then transcribe each segment and assign speakers by simple alternation.
// Requirements: ffmpeg must be installed on the host.
export async function diarizeAndTranscribe(sessionId: string, blob: Blob) {
  const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'convospark-'))
  const inputPath = path.join(tmp, 'input.webm')
  try {
    const buffer = Buffer.from(await blob.arrayBuffer())
    await fs.promises.writeFile(inputPath, buffer)

    // Split into 5-second WAV segments (mono, 16kHz) for more stable ASR
    const outPattern = path.join(tmp, 'seg-%03d.wav')
    // -y overwrite, -vn disable video, -ac 1 mono, -ar 16000 sample rate
    const cmd = `ffmpeg -y -i ${JSON.stringify(inputPath)} -vn -ac 1 -ar 16000 -f segment -segment_time 5 ${JSON.stringify(outPattern)}`
    await exec(cmd)

    const files = (await fs.promises.readdir(tmp)).filter((f) => f.startsWith('seg-') && f.endsWith('.wav')).sort()
    const results: { file: string; text: string; speaker: string }[] = []
    let speakerIdx = 1
    for (const f of files) {
      const p = path.join(tmp, f)
      const b = await fs.promises.readFile(p)
  // Convert Node Buffer -> ArrayBuffer slice to construct a Blob
  const arrayBuffer = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
  // TS typing: coerce to ArrayBuffer to construct Blob
  const segBlob = new Blob([arrayBuffer as unknown as ArrayBuffer], { type: 'audio/wav' })
      // Simple speaker assignment: alternate Speaker 1/2. This is a fallback and not accurate.
      const speaker = `Speaker ${speakerIdx}`
      const text = await doTranscribe(sessionId, segBlob, speaker)
      results.push({ file: f, text, speaker })
      speakerIdx = speakerIdx === 1 ? 2 : 1
    }

    return results
  } finally {
    // best-effort cleanup
    try { await fs.promises.rm(tmp, { recursive: true, force: true }) } catch { }
  }
}
