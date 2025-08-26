import { sessions } from "../_lib/session";

export async function POST(req: Request) {
  const body = await req.json();
  const sessionId = body.sessionId || "default";
  const question = body.question || "";

  const s = sessions.get(sessionId) || { transcripts: [] };
  const context = s.transcripts.map((t) => `${t.timestamp} ${t.speaker || "Unknown"}: ${t.text}`).join("\n");

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (OPENAI_API_KEY) {
    try {
      const prompt = `You are an assistant. Use the conversation below to answer the question.\n\nConversation:\n${context}\n\nQuestion: ${question}\nAnswer:`;
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 400 }),
      });
      const data = await resp.json();
      const answer = data?.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ answer }), { headers: { "Content-Type": "application/json" } });
    } catch (err) {
      console.error(err);
    }
  }

  // Fallback: simple keyword search
  const hits = s.transcripts.filter((t) => t.text.toLowerCase().includes(question.toLowerCase()));
  const answer = hits.length > 0 ? hits.map((h) => `${h.speaker || "Unknown"}: ${h.text}`).join("\n") : "No matching text found.";
  return new Response(JSON.stringify({ answer }), { headers: { "Content-Type": "application/json" } });
}
