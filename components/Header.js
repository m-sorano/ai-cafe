import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { motion } from 'framer-motion'

const Header = () => {
  const router = useRouter()
  const user = useUser()
  const supabase = useSupabaseClient()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (user) {
      getProfile()
    }
  }, [user])

  const getProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error in getProfile:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header className="bg-consultation-dark text-white shadow-md">
      <div className="cafe-container flex justify-between items-center py-4">
        <Link href="/" className="flex items-center space-x-2">
          <motion.h1 
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            生成AI相談室
          </motion.h1>
        </Link>

        {/* デスクトップナビゲーション */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className={`hover:text-consultation-light transition-colors ${router.pathname === '/' ? 'font-bold' : ''}`}>
            ホーム
          </Link>
          <Link href="/knowledge" className={`hover:text-consultation-light transition-colors ${router.pathname === '/knowledge' ? 'font-bold' : ''}`}>
            AI豆知識
          </Link>

          {user ? (
            <div className="relative group">
              <button 
                className="flex items-center space-x-2 focus:outline-none"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Image 
                  src={profile?.avatar_url || '/images/default-avatar.png'} 
                  alt="User Avatar" 
                  width={32} 
                  height={32} 
                  className="rounded-full border-2 border-white"
                />
                <span>{profile?.name || user.email}</span>
              </button>
              
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <Link href="/profile" className="block px-4 py-2 text-consultation-dark hover:bg-gray-100">
                    プロフィール
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-consultation-dark hover:bg-gray-100"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="cafe-button">
              ログイン
            </Link>
          )}
        </nav>

        {/* モバイルメニューボタン */}
        <button 
          className="md:hidden text-white focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* モバイルナビゲーション */}
      {isMenuOpen && (
        <motion.div 
          className="md:hidden bg-consultation-medium"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <div className="cafe-container py-4 flex flex-col space-y-4">
            <Link href="/" className={`hover:text-consultation-light transition-colors ${router.pathname === '/' ? 'font-bold' : ''}`}>
              ホーム
            </Link>
            <Link href="/knowledge" className={`hover:text-consultation-light transition-colors ${router.pathname === '/knowledge' ? 'font-bold' : ''}`}>
              AI豆知識
            </Link>
            
            {user ? (
              <>
                <Link href="/profile" className="hover:text-consultation-light transition-colors">
                  プロフィール
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="text-left hover:text-consultation-light transition-colors"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <Link href="/login" className="cafe-button inline-block">
                ログイン
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </header>
  )
}

export default Header
