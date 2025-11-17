const { createClient } = require('@supabase/supabase-js');
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Faltan variables SUPABASE_URL o SUPABASE_API_KEY en el archivo .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);