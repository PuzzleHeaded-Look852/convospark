import { fetchTranscripts } from "../_lib/session";
import { subscribe } from '../_lib/bus'

function createSSEStream(handler: (send: (data: string) => void, abortSignal: AbortSignal) => Promise<void>) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const send = async (data: string) => {
    await writer.write(encodeSSE(data));
  };

  const abortController = new AbortController();

  handler(send, abortController.signal).then(() => writer.close(), () => writer.close());

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function encodeSSE(s: string) {
  return new TextEncoder().encode(`data: ${s}\n\n`);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId") || "default";

  return createSSEStream(async (send, abort) => {
    const s = await fetchTranscripts(sessionId)

    // Stream existing transcripts first
    for (let i = 0; i < s.length; i++) {
      if (abort.aborted) break
      const chunk = s[i]
      await send(`${chunk.speaker || 'Unknown'}: ${chunk.text}`)
    }

    // Subscribe for realtime updates and forward them
    const unsub = subscribe(sessionId, (msg) => {
      if (!abort.aborted) send(msg)
    })

    // wait until abort
    await new Promise<void>((resolve) => {
      const int = setInterval(() => { if (abort.aborted) { clearInterval(int); resolve() } }, 250)
    })
    unsub()
  });
}
