import { fetchTranscripts } from "../_lib/session";

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

    // Stream each transcript as a partial summary for demo.
    for (let i = 0; i < s.length; i++) {
      if (abort.aborted) break
      const chunk = s[i]
      const speaker = chunk.speaker || 'Unknown'
      const text = chunk.text || ''
      // Create a mock summary sentence including speaker
      const summary = `Update ${i + 1} — ${speaker}: ${text}`
      await send(summary)
      // small delay to simulate processing
      await new Promise((r) => setTimeout(r, 300))
    }

    // Final combined summary
    const final = `Final summary: ${s.map((t) => (t.speaker ? t.speaker + ': ' : '') + (t.text || '')).join(' | ')}`
    await send(final)
  });
}
