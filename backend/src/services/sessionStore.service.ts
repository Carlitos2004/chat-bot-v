import { Session, MessageRole, createSession, createMessage } from "../models/chat.model.js";

const sessions: Record<string, Session> = {};

export function getSession(sessionId: string): Session | null {
  return sessions[sessionId] || null;
}

export function appendMessage(
  sessionId: string,
  {
    role,
    content,
    intent_detected,
    timestamp,
    user_id,
  }: {
    role: MessageRole;
    content: string;
    intent_detected?: string | null;
    timestamp?: string;
    user_id?: string | null;
  }
): void {
  if (!sessions[sessionId]) {
    sessions[sessionId] = createSession(sessionId, user_id ?? null);
  }

  const msg = createMessage(role, content, intent_detected ?? null);

  if (timestamp) {
    msg.timestamp = timestamp;
  }

  sessions[sessionId].messages.push(msg);
}

export function getAllSessions(): Record<string, Session> {
  return sessions;
}
