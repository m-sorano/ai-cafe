import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase, getCategories } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

const PostForm = ({ user, onPostCreated }) => {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCategoryDescription, setShowCategoryDescription] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // カテゴリーを取得
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      const categoriesData = await getCategories();
      setCategories(categoriesData);
      if (categoriesData.length > 0) {
        setCategory(categoriesData[0].id);
      }
      setIsLoading(false);
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim()) {
      setError('投稿内容を入力してください')
      return
    }

    if (!category) {
      setError('カテゴリーを選択してください')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([
          { 
            id: uuidv4(),
            user_id: user.id, 
            content: content.trim(), 
            category: category // カテゴリーIDを保存
          }
        ])
        .select(`
          *,
          profiles:user_id (id, name, avatar_url),
          comments:comments (
            id,
            content,
            created_at,
            profiles:user_id (id, name, avatar_url)
          ),
          reactions:reactions (
            id,
            type,
            profiles:user_id (id, name)
          )
        `)
        .single()
      
      if (error) {
        throw error
      }
      
      setContent('')
      setIsExpanded(false)
      
      if (onPostCreated) {
        onPostCreated(data)
      }
    } catch (error) {
      console.error('投稿エラー:', error)
      setError('投稿に失敗しました: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // AI豆知識カードを生成する関数
  const generateKnowledgeCard = async (postId) => {
    console.log('Starting knowledge card generation for post:', postId)
    
    try {
      // APIエンドポイントを呼び出して知識カードを生成
      const response = await fetch('/api/generate-knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '知識カードの生成に失敗しました');
      }
      
      const data = await response.json();
      console.log('Knowledge card created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error generating knowledge card:', error);
      throw error;
    }
  }

  // 選択されたカテゴリーの説明を取得
  const getSelectedCategoryDescription = () => {
    const selectedCategory = categories.find(cat => cat.id === category);
    return selectedCategory ? selectedCategory.description : '';
  }

  return (
    <div className="cafe-card bg-wood-light border border-wood-medium mb-6">
      <h3 className="text-xl font-bold mb-3 text-coffee-dark">新しい投稿を作成</h3>
      
      <form onSubmit={handleSubmit}>
        {/* カテゴリー選択 */}
        <div className="mb-4">
          <label htmlFor="category" className="block text-coffee-dark mb-2 font-medium">
            カテゴリー
          </label>
          {isLoading ? (
            <div className="animate-pulse bg-gray-200 h-10 rounded"></div>
          ) : (
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="cafe-input bg-cream w-full appearance-none pr-10"
              onFocus={() => setShowCategoryDescription(true)}
              onBlur={() => setShowCategoryDescription(false)}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
          {showCategoryDescription && (
            <p className="mt-1 text-sm text-coffee-medium">{getSelectedCategoryDescription()}</p>
          )}
        </div>
        
        <div className="mb-4 relative">
          <div className="flex items-start">
            <img
              src={user.avatar_url || '/images/default-avatar.png'}
              alt={user.name || user.email || 'ユーザー'}
              className="w-10 h-10 rounded-full mr-3 border border-wood-light"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="AIについての質問や知識をシェアしましょう..."
              className="cafe-input bg-cream min-h-[100px]"
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        {error && (
          <div className="mb-4 text-red-500 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex justify-end">
          {isExpanded && (
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="mr-2 px-4 py-2 rounded-full border border-wood-medium text-coffee-dark hover:bg-wood-light transition-colors"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
          )}
          <button
            type="submit"
            className="cafe-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? '投稿中...' : '投稿する'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PostForm
