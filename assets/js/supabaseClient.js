import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://pqmurfhshztlrztqjqpk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-XaLOQn6arnE_PVhCiDGzQ_By2VmRc_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
