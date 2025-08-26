import { fetchTranscripts } from "../_lib/session";

export async function GET(req: Request) {
  const url = new URL(req.url)
  const sessionId = url.searchParams.get("sessionId") || "default"
  const transcripts = await fetchTranscripts(sessionId)
  return new Response(JSON.stringify({ transcripts }), { headers: { "Content-Type": "application/json" } })
}
