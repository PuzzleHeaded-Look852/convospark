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
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
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
              <button className="btn primary" onClick={async () => { setAnswer(null); try { const resp = await fetch('/api/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, question }) }); const data = await resp.json(); setAnswer(data.answer); } catch (_) { setAnswer('Error asking question'); } }}>Ask</button>
            </div>
            {answer && <div className="answer">{answer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
 

