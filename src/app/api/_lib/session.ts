export type Transcript = {
  text: string;
  speaker?: string;
  timestamp: string;
};

export type Session = {
  transcripts: Transcript[];
};

// In-memory session store for prototype/demo purposes.
// NOTE: Serverless deployments may not preserve in-memory state. Use Redis or a DB in production.
export const sessions = new Map<string, Session>();
