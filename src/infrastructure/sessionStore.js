const sessions = new Map();

export function appendMessage(sessionId, message) {
  const current = sessions.get(sessionId) ?? {
    session_id: sessionId,
    messages: [],
  };

  current.messages.push(message);
  sessions.set(sessionId, current);
}

export function getSession(sessionId) {
  return sessions.get(sessionId) ?? null;
}
