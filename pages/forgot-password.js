import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleResetRequest = async (e) => {
    e.preventDefault()
    
    try {
      setError(null)
      setMessage(null)
      setLoading(true)
      
      // メールアドレスの簡易バリデーション
      if (!email || !email.includes('@')) {
        setError('有効なメールアドレスを入力してください')
        setLoading(false)
        return
      }
      
      // パスワードリセットメールの送信
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) {
        throw error
      }
      
      setMessage('パスワードリセット用のリンクをメールで送信しました。メールをご確認ください。')
    } catch (error) {
      console.error('Error requesting password reset:', error)
      setError(error.message || 'パスワードリセットリクエストに失敗しました')
    } finally {
      setLoading(false)
    }
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
            パスワードをお忘れですか？
          </h1>
          
          <p className="text-center text-coffee-medium mb-6">
            登録したメールアドレスを入力してください。パスワードリセット用のリンクをメールで送信します。
          </p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              {message}
            </div>
          )}
          
          <form onSubmit={handleResetRequest} className="space-y-4">
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
                autoFocus
              />
            </div>
            
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
                    送信中...
                  </span>
                ) : 'リセットリンクを送信'}
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <Link href="/login" className="text-coffee-medium hover:text-coffee-dark transition-colors">
                ログインページに戻る
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </Layout>
  )
}
