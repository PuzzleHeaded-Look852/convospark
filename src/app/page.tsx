"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [recording, setRecording] = useState(false);
  const [sessionId] = useState(() => "session-" + Math.random().toString(36).slice(2, 9));
  const [updates, setUpdates] = useState<string[]>([]);
  type Transcript = { text: string; speaker?: string; timestamp: string };
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [speaker, setSpeaker] = useState<string>("Speaker 1");
  const [question, setQuestion] = useState<string>("");
  const [answer, setAnswer] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const lastBlobRef = useRef<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState('')

  useEffect(() => {
    const evt = new EventSource(`/api/stream-summary?sessionId=${sessionId}`);
    evt.onmessage = (e) => setUpdates((u) => [...u, e.data]);
    evt.onerror = () => evt.close();

    const fetchTranscripts = async () => {
      try {
        const r = await fetch(`/api/session?sessionId=${sessionId}`);
        const j = await r.json();
        setTranscripts(j.transcripts || []);
      } catch {
        /* ignore */
      }
    };

    fetchTranscripts();
    const timer = setInterval(fetchTranscripts, 2000);
    return () => { evt.close(); clearInterval(timer); };
  }, [sessionId]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // choose best available mime type for mobile compatibility
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/wav']
    let mime = ''
    for (const c of candidates) {
      try {
        const tester = (MediaRecorder as unknown as { isTypeSupported?: (s: string) => boolean })
        if (tester.isTypeSupported?.(c)) { mime = c; break }
      } catch {
        // ignore
      }
    }
    const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
    mediaRecorderRef.current = mr;
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = async () => {
      const blobType = chunksRef.current[0]?.type || 'audio/webm'
      const blob = new Blob(chunksRef.current, { type: blobType });
  lastBlobRef.current = blob
      const fd = new FormData();
      fd.append("audio", blob, "audio.webm");
      fd.append("speaker", speaker);
  try { await fetch(`/api/transcribe?sessionId=${sessionId}`, { method: "POST", body: fd }); } catch { /* ignore */ }
    };
    mr.start();
    setRecording(true);
  };

  const stop = () => { mediaRecorderRef.current?.stop(); mediaRecorderRef.current = null; setRecording(false); };

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <div>
            <div className="title">ConvoSpark</div>
            <div className="subtitle">Minimal meeting AI — record, summarize, and ask in real time</div>
          </div>
          <div style={{ flex: 1 }} />
          <div className="controls">
            <input className="input" value={speaker} onChange={(e) => setSpeaker(e.target.value)} style={{ width: 140 }} />
            <button className="btn primary" onClick={start} disabled={recording}>Start</button>
            <button className="btn" onClick={stop} disabled={!recording}>Stop</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 18 }}>
          <div style={{ flex: 1 }}>
            <div className="subtitle">Conversation</div>
            <div style={{ marginTop: 8, marginBottom: 8 }}>
              <label style={{ fontSize: 13, color: 'var(--card-light-muted)', display: 'block', marginBottom: 6 }}>Upload audio file (fallback):</label>
              <input type="file" accept="audio/*" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                lastBlobRef.current = f
                const fd = new FormData(); fd.append('audio', f); fd.append('speaker', speaker);
                try { await fetch(`/api/transcribe?sessionId=${sessionId}`, { method: 'POST', body: fd }); alert('Uploaded'); } catch { alert('Upload failed'); }
              }} />
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button className="btn" onClick={async () => {
                  const b = lastBlobRef.current; if (!b) return alert('No recording available');
                  const fd = new FormData(); fd.append('audio', b); fd.append('sessionId', sessionId);
                  try {
                    const r = await fetch('/api/diarize', { method: 'POST', body: fd });
                    const j = await r.json(); alert('Diarize done: ' + (j.parts?.length || 0))
                  } catch { alert('Diarize failed') }
                }}>Diarize fallback</button>
                <input className="input" placeholder="Zoom recording URL (for test)" value={recordingUrl} onChange={(e) => setRecordingUrl(e.target.value)} />
                <button className="btn" onClick={async () => {
                  if (!recordingUrl) return alert('enter a recording url');
                  try {
                    const body = { recordingUrl, sessionId }
                    const r = await fetch('/api/zoom/forward', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                    const j = await r.json(); alert('Forwarded: ' + JSON.stringify(j))
                  } catch { alert('forward failed') }
                }}>Forward to Zoom</button>
              </div>
            </div>
            <div className="transcript-list">
              {transcripts.length === 0 && <div className="time">No transcripts yet — record some audio.</div>}
              {transcripts.map((t: Transcript, i: number) => (
                <div key={i} className="transcript-item">
                  <div className="speaker">{t.speaker || 'Unknown'}</div>
                  <div style={{ flex: 1 }}>
                    <div className="line">{t.text}</div>
                    <div className="time">{new Date(t.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ width: 360 }}>
            <div className="subtitle">Live summary</div>
            <div className="card" style={{ marginTop: 8, minHeight: 220 }}>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{updates.length === 0 ? 'No summary updates yet.' : updates[updates.length - 1]}</div>
            </div>

            <div className="qa">
              <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} style={{ flex: 1 }} placeholder="Ask about this meeting" />
              <button className="btn primary" onClick={async () => { setAnswer(null); try { const resp = await fetch('/api/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, question }) }); const data = await resp.json(); setAnswer(data.answer); } catch { setAnswer('Error asking question'); } }}>Ask</button>
            </div>
            {answer && <div className="answer">{answer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
 

