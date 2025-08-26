import { sessions } from "../_lib/session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId") || "default";
  const s = sessions.get(sessionId) || { transcripts: [] };
  return new Response(JSON.stringify({ transcripts: s.transcripts }), { headers: { "Content-Type": "application/json" } });
}
