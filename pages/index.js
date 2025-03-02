import { useState, useEffect } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import { supabase, getCategories, getProfile } from '../lib/supabase'
import Layout from '../components/Layout'
import PostForm from '../components/PostForm'
import PostList from '../components/PostList'
import KnowledgeCardPreview from '../components/KnowledgeCardPreview'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Home() {
  const supabaseUser = useUser()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [filteredPosts, setFilteredPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState([])
  const [categoryIdMap, setCategoryIdMap] = useState({})
  const [knowledgeCards, setKnowledgeCards] = useState([])

  // ユーザー情報の取得（プロフィール情報を含む）
  useEffect(() => {
    const fetchUserWithProfile = async () => {
      if (!supabaseUser) {
        setUser(null);
        return;
      }
      
      try {
        // プロフィール情報を取得
        const profileData = await getProfile(supabaseUser.id);
        
        // ユーザー情報とプロフィール情報を結合
        const combinedUserData = {
          ...supabaseUser,
          ...profileData,
          // 確実にavatar_urlが存在するようにする
          avatar_url: profileData.avatar_url || '/images/default-avatar.png',
          // 確実にnameが存在するようにする
          name: profileData.name || supabaseUser.email?.split('@')[0] || 'ユーザー'
        };
        
        console.log('Combined user data:', combinedUserData);
        setUser(combinedUserData);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // エラー時は基本情報のみ設定
        setUser({
          ...supabaseUser,
          avatar_url: '/images/default-avatar.png',
          name: supabaseUser.email?.split('@')[0] || 'ユーザー'
        });
      }
    };
    
    fetchUserWithProfile();
  }, [supabaseUser]);

  // カテゴリーの取得
  useEffect(() => {
    const fetchCategories = async () => {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
      
      // カテゴリー名とIDのマッピングを作成
      const mapping = {};
      categoriesData.forEach(cat => {
        // カテゴリー名から内部IDを抽出（例: "[初心者向け] AIはじめの一歩" → "beginner"）
        const match = cat.name.match(/\[([^\]]+)\]/);
        if (match) {
          const categoryType = match[1].trim();
          let categoryKey = '';
          
          if (categoryType.includes('初心者向け')) categoryKey = 'beginner';
          else if (categoryType.includes('活用事例')) categoryKey = 'usecase';
          else if (categoryType.includes('ツール・サービス')) categoryKey = 'tools';
          else if (categoryType.includes('悩み相談')) categoryKey = 'consultation';
          else if (categoryType.includes('専門家向け')) categoryKey = 'expert';
          else if (categoryType.includes('雑談・交流')) categoryKey = 'free';
          
          if (categoryKey) {
            mapping[categoryKey] = cat.id;
          }
        }
      });
      
      setCategoryIdMap(mapping);
    };
    
    fetchCategories();
  }, []);

  // 投稿を取得
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      
      let query = supabase
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
        .order('created_at', { ascending: false })
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching posts:', error)
        setLoading(false)
        return
      }
      
      setPosts(data || [])
      setFilteredPosts(data || [])
      setLoading(false)
    }
    
    fetchPosts()
  }, [])

  // 検索とフィルタリングを処理
  useEffect(() => {
    let result = [...posts];
    
    // カテゴリーでフィルタリング
    if (selectedCategory !== 'all') {
      // カテゴリーIDを取得
      const categoryId = categoryIdMap[selectedCategory];
      
      // 新しいカテゴリーシステムと古いblend_typeの両方に対応
      result = result.filter(post => {
        // まずcategoryフィールドを確認
        if (post.category) {
          return post.category === categoryId;
        } 
        // 次にblend_typeフィールドを確認（後方互換性のため）
        else if (post.blend_type) {
          // 古いblend_typeから新しいカテゴリーへのマッピング
          const categoryMapping = {
            'AI相談': 'consultation',
            'latte': 'beginner',
            'cappuccino': 'usecase',
            'mocha': 'expert',
            'espresso': 'tools',
            'americano': 'free'
          };
          return categoryMapping[post.blend_type] === selectedCategory;
        }
        return false;
      });
    }
    
    // 検索語でフィルタリング
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(post => 
        post.content.toLowerCase().includes(term) ||
        (post.profiles?.name && post.profiles.name.toLowerCase().includes(term))
      );
    }
    
    setFilteredPosts(result);
  }, [posts, selectedCategory, searchTerm, categoryIdMap]);

  // AI豆知識カードを取得
  useEffect(() => {
    async function fetchKnowledgeCards() {
      try {
        const { data, error } = await supabase
          .from('knowledge_cards')
          .select(`
            id,
            title,
            content,
            tags,
            created_at,
            source_post_id,
            source_post:source_post_id (
              id,
              content,
              created_at,
              user_id,
              category,
              profiles:user_id (id, name, avatar_url)
            )
          `)
          .order('created_at', { ascending: false })
          .limit(3)
        
        if (error) {
          console.error('Error fetching knowledge cards:', error)
          return
        }
        
        setKnowledgeCards(data || [])
      } catch (error) {
        console.error('Error in fetchKnowledgeCards:', error)
      }
    }
    
    fetchKnowledgeCards()
  }, [])

  // 新しい投稿が作成されたときの処理
  const handleNewPost = (newPost) => {
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    
    // フィルターが「すべて表示」または新しい投稿のカテゴリーと一致する場合のみ表示
    if (selectedCategory === 'all' || newPost.category === categoryIdMap[selectedCategory]) {
      setFilteredPosts([newPost, ...filteredPosts]);
    }
  }

  // 投稿を削除する関数
  const handleDeletePost = async (postId) => {
    try {
      // 投稿データが更新されたら、ローカルの投稿リストを更新
      setPosts(posts.filter(post => post.id !== postId))
      setFilteredPosts(filteredPosts.filter(post => post.id !== postId))
    } catch (error) {
      console.error('Error handling post deletion:', error)
    }
  }

  return (
    <Layout>
      <div className="cafe-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-center text-consultation-dark mb-2">
            生成AI相談室 へようこそ
          </h1>
          <p className="text-center text-consultation-medium mb-6">
            AIの疑問、みんなで解決！初心者から専門家まで集う生成AI相談室
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2">
            {/* 検索とフィルター */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="cafe-card bg-cream mb-6"
            >
              <div className="mb-4">
                <label htmlFor="search" className="block text-coffee-dark mb-2">キーワード検索</label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="投稿内容やユーザー名で検索..."
                  className="cafe-input bg-white w-full"
                />
              </div>
              
              <div>
                <label htmlFor="category-filter" className="block text-coffee-dark mb-2">カテゴリーで絞り込み</label>
                <div className="relative">
                  <select
                    id="category-filter"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="cafe-input bg-white w-full appearance-none pr-10"
                  >
                    <option value="all">すべて表示</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={Object.keys(categoryIdMap).find(key => categoryIdMap[key] === cat.id)}>{cat.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-5 h-5 text-coffee-dark" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 投稿フォーム */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-8"
              >
                <PostForm 
                  user={user} 
                  onPostCreated={handleNewPost}
                />
              </motion.div>
            )}

            {/* 投稿一覧 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <PostList 
                posts={filteredPosts} 
                loading={loading}
                user={user}
                showDeleteButton={true}
                onDeletePost={handleDeletePost}
              />
            </motion.div>
          </div>

          {/* サイドバー */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-6"
          >
            {/* ログインプロモーション */}
            {!user && (
              <div className="cafe-card bg-gray-50 border border-gray-200">
                <h3 className="text-xl font-bold mb-3 text-consultation-dark">生成AI相談室に参加する</h3>
                <p className="text-gray-600 mb-4">
                  ログインして、AIを活用した相談サービスを利用しましょう。投稿やコメント、リアクションが可能になります。
                </p>
                <Link href="/login" className="cafe-button inline-block">
                  ログイン / 新規登録
                </Link>
              </div>
            )}
            
            {/* AI豆知識カード */}
            <div className="cafe-card bg-knowledge-light border border-knowledge-medium">
              <h3 className="text-xl font-bold mb-3 text-knowledge-dark">AI豆知識</h3>
              {knowledgeCards.length > 0 ? (
                <div className="space-y-4">
                  {knowledgeCards.map((card) => (
                    <KnowledgeCardPreview key={card.id} card={card} />
                  ))}
                  <div className="text-center mt-4">
                    <Link href="/knowledge" className="text-knowledge-dark hover:text-knowledge-medium transition-colors">
                      もっと見る →
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-coffee-medium">
                  AI豆知識はまだありません。
                </p>
              )}
            </div>
            
            {/* カテゴリー一覧 */}
            <div className="cafe-card bg-cream border border-wood-medium">
              <h3 className="text-xl font-bold mb-3 text-coffee-dark">カテゴリー</h3>
              <ul className="space-y-2">
                <li key="all">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-wood-medium text-white'
                        : 'text-coffee-dark hover:bg-wood-light'
                    }`}
                  >
                    すべて表示
                  </button>
                </li>
                {categories.map(category => {
                  // カテゴリー名から内部IDを抽出
                  const match = category.name.match(/\[([^\]]+)\]/);
                  let categoryKey = '';
                  
                  if (match) {
                    const categoryType = match[1].trim();
                    
                    if (categoryType.includes('初心者向け')) categoryKey = 'beginner';
                    else if (categoryType.includes('活用事例')) categoryKey = 'usecase';
                    else if (categoryType.includes('ツール・サービス')) categoryKey = 'tools';
                    else if (categoryType.includes('悩み相談')) categoryKey = 'consultation';
                    else if (categoryType.includes('専門家向け')) categoryKey = 'expert';
                    else if (categoryType.includes('雑談・交流')) categoryKey = 'free';
                  }
                  
                  return categoryKey ? (
                    <li key={category.id}>
                      <button
                        onClick={() => setSelectedCategory(categoryKey)}
                        className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                          selectedCategory === categoryKey
                            ? 'bg-wood-medium text-white'
                            : 'text-coffee-dark hover:bg-wood-light'
                        }`}
                      >
                        {category.name}
                      </button>
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
