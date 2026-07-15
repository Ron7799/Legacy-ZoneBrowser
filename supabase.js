import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://atuuhaycetzagxdlpknd.supabase.co/rest/v1/";
const supabaseKey = "sb_publishable_rsf9OAj6cHnCl5vRTv510w_QmVYBOBb";

export const supabase = createClient(supabaseUrl, supabaseKey);