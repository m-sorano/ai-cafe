import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

// この関数は、ソーシャルログイン後のリダイレクト先として使用されます
const AuthCallback = () => {
  const router = useRouter()
  const supabase = useSupabaseClient()

  useEffect(() => {
    // URLからハッシュパラメータを取得
    const { hash } = window.location
    
    if (hash && hash.includes('access_token')) {
      // Supabaseの認証状態を更新
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // 認証が成功したらホームページにリダイレクト
          router.push('/')
        }
      })
    } else {
      // 認証情報がない場合はログインページにリダイレクト
      router.push('/login')
    }
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center bg-wood-pattern">
      <div className="text-center">
        <div className="animate-pulse mb-4">
          <svg className="mx-auto h-12 w-12 text-coffee-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-coffee-dark">認証処理中...</h2>
        <p className="text-coffee-medium mt-2">しばらくお待ちください</p>
      </div>
    </div>
  )
}

export default AuthCallback
