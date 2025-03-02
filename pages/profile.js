import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import Layout from '../components/Layout'
import PostList from '../components/PostList'
import { motion } from 'framer-motion'
import { updateProfile } from '../lib/supabase'

const Profile = () => {
  const router = useRouter()
  const user = useUser()
  const supabase = useSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [userPosts, setUserPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    async function getProfile() {
      setLoading(true)
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, bio, website')
          .eq('id', user.id)
          .single()

        if (error) throw error

        setName(data.name || '')
        setAvatarUrl(data.avatar_url || '')
        setBio(data.bio || '')
        setWebsite(data.website || '')
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    getProfile()
  }, [user, router, supabase])

  // ユーザーの投稿を取得する関数
  const fetchUserPosts = async () => {
    if (!user) return

    setPostsLoading(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (id, name, avatar_url),
          comments (
            id,
            content,
            created_at,
            profiles:user_id (id, name, avatar_url)
          ),
          reactions (
            id,
            type,
            profiles:user_id (id, name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setUserPosts(data || [])
    } catch (error) {
      console.error('Error fetching user posts:', error)
    } finally {
      setPostsLoading(false)
    }
  }

  // タブが変更されたときに投稿を取得
  useEffect(() => {
    if (activeTab === 'posts') {
      fetchUserPosts()
    }
  }, [activeTab, user])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    
    try {
      setLoading(true)
      
      const updates = {
        id: user.id,
        name,
        avatar_url: avatarUrl,
        bio,
        website
      }

      // ライブラリ関数を使用してプロフィールを更新
      const { error } = await updateProfile(updates)

      if (error) throw new Error(error)
      
      setSuccess(true)
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('プロフィールの更新に失敗しました: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const uploadAvatar = async (event) => {
    try {
      setUploading(true)
      setError(null)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('アップロードするファイルを選択してください')
      }

      const file = event.target.files[0]
      
      // ファイルサイズをチェック (2MB以下)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('ファイルサイズは2MB以下にしてください')
      }

      // ファイル名とパスの生成
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      console.log('Attempting to upload file:', filePath)
      console.log('User ID:', user.id)
      console.log('User role:', user.role)
      console.log('Auth status:', supabase.auth.session ? 'Authenticated' : 'Not authenticated')

      try {
        // 直接アップロードを試みる
        const { data, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          console.error('Upload error details:', JSON.stringify(uploadError, null, 2))
          
          // 特定のエラーに対する処理
          if (uploadError.statusCode === 404 && uploadError.error === "Bucket not found") {
            throw new Error('ストレージバケットが見つかりません。Supabaseダッシュボードで "avatars" バケットが作成されているか確認してください。')
          }
          
          // RLSポリシー違反エラーの処理 - より広範なチェック
          if (
            (uploadError.message && uploadError.message.includes('violates row-level security policy')) ||
            (uploadError.error && uploadError.error.includes('violates row-level security policy')) ||
            (uploadError.details && uploadError.details.includes('violates row-level security policy')) ||
            (uploadError.message && uploadError.message.includes('permission denied')) ||
            (uploadError.error && uploadError.error.includes('permission denied'))
          ) {
            console.error('RLS policy violation detected:', uploadError)
            throw new Error(`RLSポリシー違反: アップロード権限がありません。エラー詳細: ${JSON.stringify(uploadError)}`)
          }
          
          throw new Error(`アップロードエラー: ${uploadError.message || uploadError.error || JSON.stringify(uploadError)}`)
        }

        console.log('Upload successful:', data)

        // アバターURLを更新
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        console.log('Avatar URL:', urlData.publicUrl)
        
        // プロフィールの更新
        const updates = {
          id: user.id,
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        }
        
        console.log('Updating profile with:', updates)
        
        const { error: updateError } = await supabase
          .from('profiles')
          .upsert(updates, { returning: 'minimal' })
        
        if (updateError) {
          console.error('Profile update error:', updateError)
          throw new Error(`プロフィール更新エラー: ${updateError.message}`)
        }

        setAvatarUrl(urlData.publicUrl)
        setSuccess(true)
      } catch (error) {
        console.error('Error uploading avatar:', error)
        setError('アバターのアップロードに失敗しました: ' + (error.message || error))
      } finally {
        setUploading(false)
      }
    } catch (error) {
      console.error('Error in uploadAvatar:', error)
      setError('アバターのアップロードに失敗しました: ' + (error.message || error))
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // 投稿を削除する関数
  const handleDeletePost = async (postId) => {
    try {
      // 投稿データが更新されたら、ローカルの投稿リストを更新
      setUserPosts(userPosts.filter(post => post.id !== postId))
    } catch (error) {
      console.error('Error handling post deletion:', error)
    }
  }

  if (loading && !user) {
    return (
      <Layout>
        <div className="cafe-container py-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-wood-light mb-4"></div>
            <div className="text-coffee-medium">読み込み中...</div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="cafe-container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-2xl font-bold text-center text-coffee-dark mb-6">
            マイページ
          </h1>

          {/* タブナビゲーション */}
          <div className="flex border-b border-wood-light mb-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-4 font-medium ${
                activeTab === 'profile'
                  ? 'text-coffee-dark border-b-2 border-coffee-dark'
                  : 'text-coffee-medium hover:text-coffee-dark'
              }`}
            >
              プロフィール設定
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-2 px-4 font-medium ${
                activeTab === 'posts'
                  ? 'text-coffee-dark border-b-2 border-coffee-dark'
                  : 'text-coffee-medium hover:text-coffee-dark'
              }`}
            >
              投稿履歴
            </button>
          </div>

          {/* プロフィール設定タブ */}
          {activeTab === 'profile' && (
            <div className="cafe-card bg-cream">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* アバター */}
                <div className="flex flex-col items-center">
                  <div className="mb-4 relative">
                    <img
                      src={avatarUrl || '/images/default-avatar.png'}
                      alt="アバター"
                      className="w-24 h-24 rounded-full object-cover border-4 border-wood-medium"
                    />
                    <label
                      htmlFor="avatar"
                      className="absolute bottom-0 right-0 bg-wood-medium text-cream rounded-full p-2 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                    </label>
                    <input
                      type="file"
                      id="avatar"
                      accept="image/*"
                      onChange={uploadAvatar}
                      disabled={uploading}
                      className="hidden"
                    />
                  </div>
                  {uploading && <p className="text-coffee-medium text-sm">アップロード中...</p>}
                </div>

                {/* 名前 */}
                <div>
                  <label htmlFor="name" className="block text-coffee-dark font-medium mb-1">
                    表示名
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="cafe-input"
                    placeholder="あなたの名前"
                  />
                </div>

                {/* 自己紹介 */}
                <div>
                  <label htmlFor="bio" className="block text-coffee-dark font-medium mb-1">
                    自己紹介
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="cafe-input min-h-[100px]"
                    placeholder="あなた自身について教えてください"
                  />
                </div>

                {/* ウェブサイト */}
                <div>
                  <label htmlFor="website" className="block text-coffee-dark font-medium mb-1">
                    ウェブサイト
                  </label>
                  <input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="cafe-input"
                    placeholder="https://example.com"
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-green-600 text-sm">
                    プロフィールが更新されました！
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="px-4 py-2 rounded-full border border-wood-medium text-coffee-dark hover:bg-wood-light transition-colors"
                  >
                    ログアウト
                  </button>
                  <button
                    type="submit"
                    className="cafe-button"
                    disabled={loading}
                  >
                    {loading ? '更新中...' : 'プロフィールを更新'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 投稿履歴タブ */}
          {activeTab === 'posts' && (
            <div>
              <h2 className="text-xl font-bold text-coffee-dark mb-4">あなたの投稿</h2>
              {postsLoading ? (
                <div className="cafe-card flex justify-center items-center p-12">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-wood-light mb-4"></div>
                    <div className="text-coffee-medium">投稿を読み込み中...</div>
                  </div>
                </div>
              ) : userPosts.length > 0 ? (
                <PostList 
                  posts={userPosts} 
                  loading={false} 
                  user={user} 
                  showDeleteButton={true}
                  onDeletePost={handleDeletePost}
                />
              ) : (
                <div className="cafe-card bg-cream text-center p-8">
                  <p className="text-coffee-medium">まだ投稿がありません。</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  )
}

export default Profile
