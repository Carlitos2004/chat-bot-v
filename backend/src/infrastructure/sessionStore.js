const sessions = {};

export function getSession(sessionId) {
  return sessions[sessionId] || null;
}

export function appendMessage(sessionId, message) {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      session_id: sessionId,
      status: "active",
      messages: [],
    };
  }

  sessions[sessionId].messages.push(message);
}
