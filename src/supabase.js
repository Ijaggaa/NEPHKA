import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gefylwykehgocrwiiaxk.supabase.co'
const supabaseKey = 'sb_publishable_yB2hRvmebz6253HL0whpTQ_SuOHiHQm'

export const supabase = createClient(supabaseUrl, supabaseKey)
