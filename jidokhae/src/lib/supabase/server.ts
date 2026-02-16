import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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
    or: () => dummyQuery,
    in: () => dummyQuery,
    is: () => dummyQuery,
    order: () => dummyQuery,
    limit: () => dummyQuery,
    maybeSingle: () => Promise.resolve(emptyResponse),
    single: () => Promise.resolve(emptyResponse),
    then: (resolve: (value: typeof emptyResponse) => void) => Promise.resolve(emptyResponse).then(resolve),
  }

  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => dummyQuery,
  }
}

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase 환경 변수 미설정 - 더미 클라이언트 반환
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createDummyClient() as any
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 호출 시 무시
          }
        },
      },
    }
  )
}

export async function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    // Supabase Service Role 환경 변수 미설정 - 더미 클라이언트 반환
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createDummyClient() as any
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 호출 시 무시
          }
        },
      },
    }
  )
}
