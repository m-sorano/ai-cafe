import { useState, useEffect } from 'react'
import { supabase, initializeCategories } from '../lib/supabase'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import '../styles/globals.css'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [supabaseClient] = useState(() => createPagesBrowserClient())
  const router = useRouter()

  useEffect(() => {
    // ユーザーセッションの監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    // カテゴリーの初期化
    const initCategories = async () => {
      await initializeCategories();
    };
    
    initCategories();

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={pageProps.initialSession}>
      <Head>
        <title>生成AI相談室 | AIの疑問、みんなで解決！</title>
        <meta name="description" content="AIの疑問、みんなで解決！初心者から専門家まで集う生成AI相談室" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Component {...pageProps} />
      </motion.div>
    </SessionContextProvider>
  )
}

export default MyApp
