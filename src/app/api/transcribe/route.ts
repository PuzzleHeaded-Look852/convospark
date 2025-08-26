import { sessions } from "../_lib/session";

// Minimal transcription route. Accepts a POST multipart/form-data with a file field named `audio` and a `sessionId`.
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return new Response(JSON.stringify({ error: "Expected multipart/form-data" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // For simplicity we read the whole body as ArrayBuffer and do a naive parse to extract the file bytes.
  // In a real app use a robust parser like `formidable` or `busboy` on the server side.
  // NOTE: For this prototype we don't actually decode audio server-side.

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId") || "default";

  // parse formdata
  const formData = await req.formData();
  const audio = formData.get("audio") as Blob | null;
  const speaker = (formData.get("speaker") as string) || undefined;

  let text = `Transcribed audio chunk at ${new Date().toISOString()}`;

  // If OPENAI_API_KEY is present, try to call OpenAI Whisper API (experimental prototype).
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (OPENAI_API_KEY && audio) {
    try {
      // send multipart/form-data to OpenAI's transcription endpoint
      const form = new FormData();
  const audioBlob = audio as Blob;
  const buffer = await audioBlob.arrayBuffer();
  const blobType = (audioBlob as unknown as { type?: string }).type || "audio/webm";
  const file = new Blob([buffer], { type: blobType });
      form.append("file", file, "audio.webm");
      form.append("model", "whisper-1");

      const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: form as unknown as BodyInit,
      });
      const data = await resp.json();
      if (data && data.text) text = data.text;
    } catch (err) {
      // fallback to mock text
      console.error("Whisper error", err);
    }
  }

  const existing = sessions.get(sessionId) || { transcripts: [] };
  existing.transcripts.push({ text, speaker, timestamp: new Date().toISOString() });
  sessions.set(sessionId, existing);

  return new Response(JSON.stringify({ text, sessionId }), { status: 200, headers: { "Content-Type": "application/json" } });
}
