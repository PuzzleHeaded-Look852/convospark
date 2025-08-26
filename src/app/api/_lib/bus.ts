type Handler = (msg: string) => void

const subs = new Map<string, Set<Handler>>()

export function subscribe(sessionId: string, fn: Handler) {
  let set = subs.get(sessionId)
  if (!set) { set = new Set(); subs.set(sessionId, set) }
  set.add(fn)
  return () => { set!.delete(fn); if (set!.size === 0) subs.delete(sessionId) }
}

export function publish(sessionId: string, msg: string) {
  const set = subs.get(sessionId)
  if (!set) return
  for (const fn of Array.from(set)) {
    try { fn(msg) } catch { /* ignore handler errors */ }
  }
}
