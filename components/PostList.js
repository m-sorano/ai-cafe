import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { supabase, getCategories } from '../lib/supabase'
import LatteArtReaction from './LatteArtReaction'
import CommentSection from './CommentSection'

const PostList = ({ posts, loading, user, showDeleteButton = false, onDeletePost }) => {
  const [expandedPostId, setExpandedPostId] = useState(null)
  const [editingPostId, setEditingPostId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [localPosts, setLocalPosts] = useState(posts)
  const [categoryMap, setCategoryMap] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setLocalPosts(posts)
  }, [posts])

  // カテゴリーを取得
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      const categoriesData = await getCategories();
      
      // カテゴリーIDと名前のマッピングを作成
      const mapping = {};
      categoriesData.forEach(cat => {
        mapping[cat.id] = cat.name;
      });
      
      setCategoryMap(mapping);
      setIsLoading(false);
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="cafe-card flex justify-center items-center p-12">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-wood-light mb-4"></div>
          <div className="text-coffee-medium">投稿を読み込み中...</div>
        </div>
      </div>
    )
  }
  
  if (localPosts.length === 0) {
    return (
      <div className="cafe-card bg-cream text-center p-12">
        <h3 className="text-xl font-bold mb-3 text-coffee-dark">投稿がありません</h3>
        <p className="text-coffee-medium mb-6">
          まだ投稿がありません。最初の投稿を作成してみましょう！
        </p>
        {!user && (
          <a href="/login" className="cafe-button inline-block">
            ログインして投稿する
          </a>
        )}
      </div>
    )
  }
  
  const toggleExpand = (postId) => {
    setExpandedPostId(expandedPostId === postId ? null : postId)
  }
  
  // リアクションを追加する関数
  const handleReaction = async (postId, reactionType) => {
    if (!user) {
      // ログインしていない場合はログインページへ
      window.location.href = '/login'
      return
    }
    
    try {
      // 既存のリアクションを確認
      const { data: existingReaction } = await supabase
        .from('reactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single()
      
      if (existingReaction) {
        // 同じタイプなら削除、違うタイプなら更新
        if (existingReaction.type === reactionType) {
          await supabase
            .from('reactions')
            .delete()
            .eq('id', existingReaction.id)
        } else {
          await supabase
            .from('reactions')
            .update({ type: reactionType })
            .eq('id', existingReaction.id)
        }
      } else {
        // 新規リアクション
        await supabase
          .from('reactions')
          .insert([
            { 
              user_id: user.id, 
              post_id: postId, 
              type: reactionType 
            }
          ])
      }
      
      // リアクション後にリロードする代わりに、最新の投稿データを取得
      const { data: updatedPostData } = await supabase
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
        .eq('id', postId)
        .single()
      
      if (updatedPostData) {
        // 更新された投稿で状態を更新
        setLocalPosts(localPosts.map(post => 
          post.id === postId ? updatedPostData : post
        ))
      }
    } catch (error) {
      console.error('Error handling reaction:', error)
    }
  }

  // 投稿の編集を開始
  const startEditing = (post) => {
    setEditingPostId(post.id)
    setEditContent(post.content)
    setIsEditing(true)
  }

  // 投稿の編集をキャンセル
  const cancelEditing = () => {
    setEditingPostId(null)
    setEditContent('')
    setIsEditing(false)
  }

  // 投稿を更新
  const updatePost = async (postId) => {
    if (!editContent.trim()) return

    try {
      const { data, error } = await supabase
        .from('posts')
        .update({ content: editContent.trim() })
        .eq('id', postId)
        .select()

      if (error) throw error

      // 更新後に編集モードを終了
      cancelEditing()
      
      // ローカルの投稿データを更新
      setLocalPosts(localPosts.map(post => 
        post.id === postId ? { ...post, content: editContent.trim() } : post
      ))
    } catch (error) {
      console.error('Error updating post:', error)
      alert('投稿の更新に失敗しました')
    }
  }

  // 投稿を削除
  const deletePost = async (postId) => {
    if (!confirm('この投稿を削除してもよろしいですか？')) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      // 削除した投稿をローカルステートから除外
      setLocalPosts(localPosts.filter(post => post.id !== postId))
      
      // 親コンポーネントの削除ハンドラーがあれば呼び出す
      if (onDeletePost) {
        onDeletePost(postId)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('投稿の削除に失敗しました')
    }
  }

  const getCategoryName = (categoryId) => {
    // カテゴリーテーブルから名前を取得
    if (categoryMap[categoryId]) {
      return categoryMap[categoryId];
    }
    
    // 後方互換性のために古いblend_typeも対応
    const legacyCategories = {
      'AI相談': '[悩み相談] AIなんでも相談室',
      'latte': '[初心者向け] AIはじめの一歩',
      'cappuccino': '[活用事例] みんなのAI活用術',
      'mocha': '[専門家向け] AI技術深掘り',
      'espresso': '[ツール・サービス] AIツールレビュー',
      'americano': '[雑談・交流] AIフリートーク'
    };
    
    return legacyCategories[categoryId] || 'その他';
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {localPosts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="cafe-table perspective-card"
            id={`post-${post.id}`}
          >
            {/* 投稿ヘッダー */}
            <div className="flex items-start mb-4">
              <img
                src={post.profiles?.avatar_url || '/images/default-avatar.png'}
                alt={post.profiles?.name || 'ユーザー'}
                className="w-10 h-10 rounded-full mr-3 border-2 border-wood-medium"
              />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-coffee-dark">
                    {post.profiles?.name || 'ユーザー'}
                  </h4>
                  <div className="flex items-center">
                    <span className="text-xs text-coffee-medium">
                      {format(new Date(post.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                    </span>
                    
                    {/* 編集・削除ボタン */}
                    {user && user.id === post.user_id && (
                      <div className="flex ml-2">
                        <button
                          onClick={() => startEditing(post)}
                          className="ml-1 text-blue-500 hover:text-blue-700"
                          title="投稿を編集"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="ml-1 text-red-500 hover:text-red-700"
                          title="投稿を削除"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-coffee-medium mt-1">
                  <span className="inline-block px-2 py-1 bg-wood-medium text-cream rounded-full text-xs">
                    {getCategoryName(post.category || post.blend_type)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* 投稿内容 */}
            {editingPostId === post.id ? (
              <div className="mb-4">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 rounded-lg border border-wood-light focus:border-coffee-medium focus:ring-1 focus:ring-coffee-medium outline-none resize-none"
                  rows="4"
                />
                <div className="flex justify-end mt-2 space-x-2">
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => updatePost(post.id)}
                    className="px-3 py-1 bg-consultation-medium text-white rounded hover:bg-consultation-dark"
                  >
                    更新
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4 text-coffee-dark whitespace-pre-line">
                {post.content}
              </div>
            )}
            
            {/* リアクションとコメント */}
            <div className="border-t border-wood-light pt-4">
              {/* リアクション */}
              <div className="flex flex-wrap gap-2 mb-4">
                <LatteArtReaction
                  type="ハート"
                  count={post.reactions?.filter(r => r.type === 'ハート').length || 0}
                  active={user && post.reactions?.some(r => r.type === 'ハート' && r.user_id === user.id)}
                  onClick={() => handleReaction(post.id, 'ハート')}
                />
                <LatteArtReaction
                  type="ブックマーク"
                  count={post.reactions?.filter(r => r.type === 'ブックマーク').length || 0}
                  active={user && post.reactions?.some(r => r.type === 'ブックマーク' && r.user_id === user.id)}
                  onClick={() => handleReaction(post.id, 'ブックマーク')}
                />
              </div>
              
              {/* コメントボタン */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => toggleExpand(post.id)}
                  className="text-coffee-medium hover:text-coffee-dark transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  {post.comments?.length || 0} コメント
                </button>
              </div>
              
              {/* コメントセクション */}
              <AnimatePresence>
                {expandedPostId === post.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t border-wood-light"
                  >
                    <CommentSection
                      postId={post.id}
                      comments={post.comments || []}
                      user={user}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default PostList
