import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // Como el .env ahora estará en la raíz (dentro de backend), esto lo lee automáticamente

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Faltan las credenciales de Supabase en el .env");
}

// Creamos y exportamos la conexión
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');