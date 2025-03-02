import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    hasNumber: false,
    hasLowercase: false,
    hasUppercase: false
  })

  // パスワードの強度をチェック
  useEffect(() => {
    setPasswordStrength({
      length: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password)
    })
  }, [password])

  // パスワードの強度が十分かどうかをチェック
  const isPasswordStrong = () => {
    return Object.values(passwordStrength).every(value => value === true)
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    
    try {
      setError(null)
      setMessage(null)
      setLoading(true)
      
      // パスワードの強度チェック
      if (!isPasswordStrong()) {
        setError('パスワードは8文字以上で、数字、小文字、大文字を含める必要があります')
        setLoading(false)
        return
      }
      
      // パスワードの一致チェック
      if (password !== confirmPassword) {
        setError('パスワードが一致しません')
        setLoading(false)
        return
      }
      
      // パスワードの更新
      const { error } = await supabase.auth.updateUser({ password: password })
      
      if (error) {
        throw error
      }
      
      setMessage('パスワードが正常に更新されました。ログインページにリダイレクトします...')
      
      // 3秒後にログインページにリダイレクト
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      console.error('Error resetting password:', error)
      setError(error.message || 'パスワードのリセットに失敗しました')
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
            新しいパスワードを設定
          </h1>
          
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
          
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-coffee-dark mb-1">
                新しいパスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="cafe-input w-full"
                disabled={loading}
                autoFocus
              />
              
              <div className="mt-2 space-y-1 text-sm">
                <div className={`flex items-center ${passwordStrength.length ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`inline-block w-4 h-4 mr-2 rounded-full ${passwordStrength.length ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                  8文字以上
                </div>
                <div className={`flex items-center ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`inline-block w-4 h-4 mr-2 rounded-full ${passwordStrength.hasNumber ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                  数字を含む
                </div>
                <div className={`flex items-center ${passwordStrength.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`inline-block w-4 h-4 mr-2 rounded-full ${passwordStrength.hasLowercase ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                  小文字を含む
                </div>
                <div className={`flex items-center ${passwordStrength.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`inline-block w-4 h-4 mr-2 rounded-full ${passwordStrength.hasUppercase ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                  大文字を含む
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-coffee-dark mb-1">
                パスワードの確認
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="cafe-input w-full"
                disabled={loading}
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
                    更新中...
                  </span>
                ) : 'パスワードを更新'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </Layout>
  )
}
