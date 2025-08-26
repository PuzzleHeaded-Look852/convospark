"use client"

import React, { useEffect, useState } from 'react'

type SessionRow = { id: string; created_at: string }
type Transcript = { id?: number; session_id: string; speaker?: string | null; text: string; ts?: string }

export default function AdminPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [transcripts, setTranscripts] = useState<Transcript[]>([])

  useEffect(() => {
    fetch('/api/admin/sessions')
      .then(r => r.json())
      .then(d => setSessions(d.sessions || []))
  }, [])

  useEffect(() => {
    if (!selected) return
    fetch('/api/admin/transcripts?sessionId=' + encodeURIComponent(selected))
      .then(r => r.json())
      .then(d => setTranscripts(d.transcripts || []))
  }, [selected])

  return (
    <div style={{ padding: 28 }}>
      <h2>ConvoSpark Admin</h2>
      <div style={{ display: 'flex', gap: 18 }}>
        <div style={{ minWidth: 260 }}>
          <h3>Sessions</h3>
          <ul>
            {sessions.map(s => (
              <li key={s.id}>
                <button onClick={() => setSelected(s.id)} style={{ border: 'none', background: selected === s.id ? '#0b6fff' : 'transparent', color: selected === s.id ? '#fff' : '#036', padding: '8px 10px', borderRadius: 8 }}>
                  {s.id} <small style={{ display: 'block', color: '#666' }}>{s.created_at}</small>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <h3>Transcripts {selected ? `for ${selected}` : ''}</h3>
          <div style={{ background: '#fff', padding: 12, borderRadius: 10 }}>
            {transcripts.map(t => (
              <div key={t.id} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700 }}>{t.speaker || 'Unknown'} <span style={{ color: '#666', fontWeight: 400, marginLeft: 8 }}>{t.ts}</span></div>
                <div>{t.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
