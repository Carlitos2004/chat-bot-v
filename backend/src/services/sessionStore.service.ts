import { Session, MessageRole, createSession, createMessage } from "../models/chat.model.js";
// Asegúrate de que la ruta a supabase.ts sea la correcta según tus carpetas
import { supabase } from "../config/supabase.js"; 

const sessions: Record<string, Session> = {};

export function getSession(sessionId: string): Session | null {
  return sessions[sessionId] || null;
}

// ⚠️ Le agregamos 'async' porque conectarse a la BDD toma tiempo
export async function appendMessage(
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
): Promise<void> {
  
  // 1. GUARDADO EN MEMORIA (MOCK - Para no romper tu Postman local)
  if (!sessions[sessionId]) {
    sessions[sessionId] = createSession(sessionId, user_id ?? null);
  }
  const msg = createMessage(role, content, intent_detected ?? null);
  if (timestamp) msg.timestamp = timestamp;
  sessions[sessionId].messages.push(msg);

  // 2. GUARDADO REAL EN SUPABASE (Base de datos)
  try {
    // A) Primero verificamos si la sesión ya existe en la base de datos
    const { data: existingSession } = await supabase
      .from('session')
      .select('sessionId')
      .eq('sessionId', sessionId)
      .single();

    // B) Si no existe la sesión, la creamos usando 'userId'
    if (!existingSession) {
      const { error: sessionError } = await supabase
        .from('session')
        .insert([{ sessionId: sessionId, userId: user_id || null }]); // <-- Cambiado a userId
      
      if (sessionError) console.error("⚠️ Error al crear sesión en Supabase:", sessionError.message);
    }

    // C) Insertamos el mensaje usando 'sessionId'
    const { error: messageError } = await supabase
      .from('messages')
      .insert([{
        sessionId: sessionId,       // <-- Cambiado a sessionId
        role: role,
        content: content,
        intent_detected: intent_detected || null,
        timestamp: timestamp || new Date().toISOString()
      }]);

    if (messageError) {
      console.error("⚠️ Error al guardar mensaje en Supabase:", messageError.message);
    } else {
      console.log(`✅ Mensaje de '${role}' guardado correctamente en la BDD.`);
    }

  } catch (error) {
    console.error("❌ Fallo crítico al conectar con Supabase:", error);
  }
}

export function getAllSessions(): Record<string, Session> {
  return sessions;
}