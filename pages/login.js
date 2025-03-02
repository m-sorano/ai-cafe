import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { supabase, createProfileForNewUser } from '../lib/supabase'
import Layout from '../components/Layout'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // ログイン状態をチェック（ただし、リダイレクトはしない）
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setCheckingAuth(false)
    }
    
    checkUser()
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isSignUp) {
        // 新規ユーザー登録
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              name: nickname || email.split('@')[0]
            }
          }
        })

        if (error) throw error

        if (data?.user) {
          // プロフィールを作成
          try {
            const { error: profileError } = await createProfileForNewUser(
              data.user.id,
              email,
              nickname
            );
            
            if (profileError) {
              throw new Error(profileError);
            }
            
            setSuccess('登録が完了しました。ログインしてください。')
            setIsSignUp(false)
          } catch (profileError) {
            console.error('プロフィール作成エラー:', profileError)
            setError('ユーザー登録は完了しましたが、プロフィール作成に失敗しました。管理者にお問い合わせください。')
          }
        }
      } else {
        // ログイン
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        })

        if (error) throw error

        // リダイレクト先があれば、そこへ移動
        const redirectTo = router.query.redirect || '/'
        router.push(redirectTo)
      }
    } catch (error) {
      console.error('認証エラー:', error)
      
      if (error.message.includes('Email not confirmed')) {
        setError('メールアドレスが確認されていません。メールを確認してください。')
      } else if (error.message.includes('Invalid login credentials')) {
        setError('メールアドレスまたはパスワードが正しくありません。')
      } else if (error.message.includes('User already registered')) {
        setError('このメールアドレスは既に登録されています。')
      } else {
        setError(error.message || 'エラーが発生しました。もう一度お試しください。')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setError(null)
    setSuccess(null)
  }

  if (checkingAuth) {
    return <div />
  }

  return (
    <Layout>
      <div className="cafe-container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="cafe-card max-w-md mx-auto"
        >
          <h1 className="text-3xl font-bold text-center text-coffee-dark mb-6">
            {isSignUp ? '生成AI相談室へようこそ' : 'おかえりなさい'}
          </h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-coffee-dark mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="cafe-input w-full"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-coffee-dark mb-1">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="cafe-input w-full"
                disabled={loading}
                minLength={6}
              />
              {isSignUp && (
                <p className="text-xs text-coffee-medium mt-1">
                  ※ パスワードは6文字以上で設定してください
                </p>
              )}
            </div>
            
            {!isSignUp && (
              <div className="text-right mt-1">
                <Link href="/forgot-password" className="text-sm text-coffee-medium hover:text-coffee-dark transition-colors">
                  パスワードをお忘れですか？
                </Link>
              </div>
            )}
            
            {isSignUp && (
              <div>
                <label htmlFor="nickname" className="block text-coffee-dark mb-1">
                  ニックネーム (任意)
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="cafe-input w-full"
                  disabled={loading}
                  placeholder="未入力の場合はメールアドレスが使用されます"
                />
              </div>
            )}
            
            <div className="pt-2">
              <button
                type="submit"
                className="cafe-button w-full py-3"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    処理中...
                  </span>
                ) : isSignUp ? '新規登録' : 'ログイン'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-coffee-medium hover:text-coffee-dark transition-colors"
              disabled={loading}
            >
              {isSignUp ? 'ログインはこちら' : '新規登録はこちら'}
            </button>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}
