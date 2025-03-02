import { useState, useEffect } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import Layout from '../../components/Layout'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import KnowledgeCardPreview from '../../components/KnowledgeCardPreview'

const KnowledgeCards = () => {
  const user = useUser()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)
  const [allTags, setAllTags] = useState([])

  useEffect(() => {
    async function fetchKnowledgeCards() {
      setLoading(true)
      setError(null)

      try {
        console.log('Fetching knowledge cards...')
        
        let query = supabase
          .from('knowledge_cards')
          .select('*')
          .order('created_at', { ascending: false })

        // タグでフィルタリング
        if (selectedTag) {
          console.log('Filtering by tag:', selectedTag)
          query = query.contains('tags', [selectedTag])
        }

        const { data, error } = await query

        if (error) {
          console.error('Supabase error when fetching knowledge cards:', error)
          throw error
        }
        
        console.log('Fetched knowledge cards:', data ? data.length : 0)

        // 検索語でフィルタリング
        let filteredData = data || []
        if (searchTerm) {
          console.log('Filtering by search term:', searchTerm)
          const term = searchTerm.toLowerCase()
          filteredData = filteredData.filter(
            card => 
              card.title?.toLowerCase().includes(term) || 
              card.content?.toLowerCase().includes(term)
          )
          console.log('Filtered cards count:', filteredData.length)
        }

        setCards(filteredData)

        // すべてのタグを収集
        const tags = new Set()
        data.forEach(card => {
          if (card.tags && Array.isArray(card.tags)) {
            card.tags.forEach(tag => tags.add(tag))
          }
        })
        setAllTags(Array.from(tags).sort())
        console.log('Collected tags:', Array.from(tags))
      } catch (error) {
        console.error('Error fetching knowledge cards:', error)
        setError('知識カードの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchKnowledgeCards()
  }, [selectedTag, searchTerm])

  const handleSearch = (e) => {
    e.preventDefault()
    // 検索は既に useEffect の依存配列に searchTerm があるため、
    // setSearchTerm を呼ぶだけで検索が実行される
  }

  if (loading && cards.length === 0) {
    return (
      <Layout>
        <div className="cafe-container py-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-wood-light mb-4"></div>
            <div className="text-coffee-medium">知識カードを読み込み中...</div>
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
          className="mb-8 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-coffee-dark mb-4">
            AI豆知識カード
          </h1>
          <p className="text-coffee-medium max-w-2xl mx-auto">
            生成AI相談室で共有された知識をカード形式でまとめています。
            気になるトピックを検索したり、タグでフィルタリングしたりして、AIに関する知識を深めましょう。
          </p>
        </motion.div>

        {/* 検索とフィルター */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 検索フォーム */}
            <div className="md:col-span-2">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="知識カードを検索..."
                  className="cafe-input flex-1"
                />
                <button type="submit" className="cafe-button ml-2">
                  検索
                </button>
              </form>
            </div>

            {/* タグフィルター */}
            <div>
              <select
                value={selectedTag || ''}
                onChange={(e) => setSelectedTag(e.target.value || null)}
                className="cafe-input w-full"
              >
                <option value="">すべてのタグ</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="cafe-card bg-cream text-center mb-8">
            <h2 className="text-2xl font-bold text-coffee-dark mb-4">{error}</h2>
            <button
              onClick={() => window.location.reload()}
              className="cafe-button"
            >
              再読み込み
            </button>
          </div>
        )}

        {/* 知識カード一覧 */}
        {cards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <KnowledgeCardPreview card={card} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="cafe-card bg-cream text-center">
            <h2 className="text-xl font-bold text-coffee-dark mb-4">
              知識カードが見つかりませんでした
            </h2>
            <p className="text-coffee-medium mb-6">
              検索条件に一致する知識カードがありません。別のキーワードやタグで検索してみてください。
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedTag(null)
              }}
              className="cafe-button"
            >
              すべて表示
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default KnowledgeCards
