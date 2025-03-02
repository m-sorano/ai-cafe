import { useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { supabase } from '../lib/supabase'

const CommentSection = ({ postId, comments, user }) => {
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [localComments, setLocalComments] = useState(comments)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      window.location.href = '/login'
      return
    }
    
    if (!newComment.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([
          { 
            user_id: user.id, 
            post_id: postId, 
            content: newComment.trim() 
          }
        ])
        .select(`
          *,
          profiles:user_id (*)
        `)
      
      if (error) throw error
      
      // 新しいコメントをローカルステートに追加
      setLocalComments([...localComments, data[0]])
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
      setError('コメントの投稿に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // コメントを削除する関数
  const deleteComment = async (commentId) => {
    if (!confirm('このコメントを削除してもよろしいですか？')) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      // 削除したコメントをローカルステートから除外
      setLocalComments(localComments.filter(comment => comment.id !== commentId))
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('コメントの削除に失敗しました')
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="font-bold text-coffee-dark">コメント</h4>
      
      {error && (
        <div className="text-red-500 text-sm mb-2">
          {error}
        </div>
      )}
      
      {/* コメント一覧 */}
      <div className="space-y-3 mb-4">
        {localComments.length === 0 ? (
          <p className="text-coffee-medium text-sm">まだコメントはありません</p>
        ) : (
          localComments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start"
            >
              <img
                src={comment.profiles?.avatar_url || '/images/default-avatar.png'}
                alt={comment.profiles?.name || 'ユーザー'}
                className="w-8 h-8 rounded-full mr-2 border border-wood-light"
              />
              <div className="flex-1 bg-wood-light bg-opacity-20 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-coffee-dark">
                    {comment.profiles?.name || 'ユーザー'}
                  </span>
                  <div className="flex items-center">
                    <span className="text-xs text-coffee-medium">
                      {format(new Date(comment.created_at), 'MM/dd HH:mm', { locale: ja })}
                    </span>
                    {user && user.id === comment.user_id && (
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="ml-2 text-red-500 hover:text-red-700"
                        title="コメントを削除"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-gray-800 text-sm whitespace-pre-line">
                  {comment.content}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      {/* コメント入力フォーム */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex items-start">
          <img
            src={user.avatar_url || '/images/default-avatar.png'}
            alt={user.name || user.email || 'ユーザー'}
            className="w-8 h-8 rounded-full mr-2 border border-wood-light"
          />
          <div className="flex-1 relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="コメントを入力..."
              className="w-full p-3 pr-12 rounded-lg border border-wood-light focus:border-coffee-medium focus:ring-1 focus:ring-coffee-medium outline-none resize-none"
              rows="2"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="absolute right-2 bottom-2 p-2 text-consultation-medium hover:text-consultation-dark disabled:text-wood-medium disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center">
          <a href="/login" className="cafe-button-sm inline-block">
            ログインしてコメントする
          </a>
        </div>
      )}
    </div>
  )
}

export default CommentSection
