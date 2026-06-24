import type { SupabaseClient } from '@supabase/supabase-js'

export async function getUserRole(
  supabase: SupabaseClient
): Promise<'user' | 'admin' | 'police' | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return (data?.role as 'user' | 'admin' | 'police') ?? null
}
