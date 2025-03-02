import { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import Layout from '../../components/Layout';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';

const CreateTestCard = () => {
  const user = useUser();
  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('AI生成,コーヒー');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // 投稿一覧を取得
  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('posts')
        .select('id, content, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }
      
      setPosts(data || []);
      if (data && data.length > 0) {
        setSelectedPostId(data[0].id);
        setContent(data[0].content);
        setTitle(`${data[0].content.substring(0, 30)}...に関する豆知識`);
      }
    }
    
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const handlePostChange = (e) => {
    const postId = e.target.value;
    setSelectedPostId(postId);
    
    const post = posts.find(p => p.id === postId);
    if (post) {
      setContent(post.content);
      setTitle(`${post.content.substring(0, 30)}...に関する豆知識`);
    }
  };

  const createKnowledgeCard = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/create-knowledge-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: selectedPostId,
          title,
          content,
          tags: tags.split(',').map(tag => tag.trim())
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '知識カードの作成に失敗しました');
      }

      setResult('知識カードが正常に作成されました');
    } catch (error) {
      console.error('Error creating knowledge card:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ログインしていない場合のみアクセス制限
  if (!user) {
    return (
      <Layout>
        <div className="cafe-container py-12">
          <div className="cafe-card bg-cream text-center">
            <h2 className="text-2xl font-bold text-coffee-dark mb-4">アクセス権限がありません</h2>
            <p className="text-coffee-medium mb-6">
              このページはログインユーザー専用です。ログインしてください。
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="cafe-container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-coffee-dark mb-4">
            テスト用知識カード作成
          </h1>
          <p className="text-coffee-medium max-w-2xl mx-auto">
            テスト用の知識カードを手動で作成します。
          </p>
        </motion.div>

        <div className="cafe-card bg-cream">
          <form onSubmit={createKnowledgeCard} className="space-y-4">
            <div>
              <label className="block text-coffee-dark font-medium mb-2">
                投稿を選択
              </label>
              <select
                value={selectedPostId}
                onChange={handlePostChange}
                className="cafe-input"
                required
              >
                {posts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.content.substring(0, 50)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-coffee-dark font-medium mb-2">
                タイトル
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="cafe-input"
                required
              />
            </div>

            <div>
              <label className="block text-coffee-dark font-medium mb-2">
                内容
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="cafe-input min-h-[200px]"
                required
              />
            </div>

            <div>
              <label className="block text-coffee-dark font-medium mb-2">
                タグ（カンマ区切り）
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="cafe-input"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="cafe-button"
              >
                {loading ? '作成中...' : '知識カードを作成'}
              </button>
            </div>
          </form>

          {result && (
            <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg">
              <p>{result}</p>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-100 text-red-800 rounded-lg">
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CreateTestCard;
