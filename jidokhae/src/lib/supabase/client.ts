import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// 환경 변수 검증
export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// 더미 클라이언트 (환경 변수 없을 때 사용)
function createDummyClient() {
  const emptyResponse = { data: null, error: null }

  const dummyQuery = {
    select: () => dummyQuery,
    insert: () => dummyQuery,
    update: () => dummyQuery,
    delete: () => dummyQuery,
    eq: () => dummyQuery,
    neq: () => dummyQuery,
    gt: () => dummyQuery,
    gte: () => dummyQuery,
    lt: () => dummyQuery,
    lte: () => dummyQuery,
    order: () => dummyQuery,
    limit: () => dummyQuery,
    single: () => Promise.resolve(emptyResponse),
    then: (resolve: (value: typeof emptyResponse) => void) => Promise.resolve(emptyResponse).then(resolve),
  }

  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({
        data: { user: null, session: null },
        error: { message: 'Supabase가 설정되지 않았습니다. 환경 변수를 확인해주세요.' }
      }),
      signInWithOAuth: () => Promise.resolve({
        data: { provider: null, url: null },
        error: { message: 'Supabase가 설정되지 않았습니다. 환경 변수를 확인해주세요.' }
      }),
      signUp: () => Promise.resolve({
        data: { user: null, session: null },
        error: { message: 'Supabase가 설정되지 않았습니다. 환경 변수를 확인해주세요.' }
      }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => dummyQuery,
  }
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createDummyClient() as any
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}

