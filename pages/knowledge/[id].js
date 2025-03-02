import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@supabase/auth-helpers-react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import KnowledgeCardPreview from '../../components/KnowledgeCardPreview'

const KnowledgeCardDetail = () => {
  const router = useRouter()
  const { id } = router.query
  const user = useUser()
  const [card, setCard] = useState(null)
  const [relatedCards, setRelatedCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return

    async function fetchKnowledgeCard() {
      setLoading(true)
      setError(null)

      try {
        console.log('Fetching knowledge card with id:', id)
        
        // カード詳細を取得
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
          .eq('id', id)
          .single()

        if (error) {
          console.error('Supabase error when fetching knowledge card:', error)
          throw error
        }
        
        console.log('Fetched knowledge card:', data)
        setCard(data)

        // 関連カードを取得（同じタグを持つカード）
        if (data && data.tags && data.tags.length > 0) {
          console.log('Fetching related cards with tags:', data.tags)
          
          const { data: relatedData, error: relatedError } = await supabase
            .from('knowledge_cards')
            .select('*')
            .neq('id', id) // 現在のカードを除外
            .contains('tags', data.tags)
            .limit(3)

          if (relatedError) {
            console.error('Supabase error when fetching related cards:', relatedError)
            throw relatedError
          }
          
          console.log('Fetched related cards:', relatedData ? relatedData.length : 0)
          setRelatedCards(relatedData || [])
        }
      } catch (error) {
        console.error('Error fetching knowledge card:', error)
        setError('知識カードの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchKnowledgeCard()
  }, [id])

  if (loading) {
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

  if (error || !card) {
    return (
      <Layout>
        <div className="cafe-container py-12">
          <div className="cafe-card bg-cream text-center">
            <h2 className="text-2xl font-bold text-coffee-dark mb-4">
              {error || '知識カードが見つかりませんでした'}
            </h2>
            <Link href="/knowledge" className="cafe-button">
              知識カード一覧に戻る
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="cafe-container py-12">
        {/* 戻るリンク */}
        <div className="mb-6">
          <Link
            href="/knowledge"
            className="inline-flex items-center text-coffee-dark hover:text-coffee-medium transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            知識カード一覧に戻る
          </Link>
        </div>

        {/* カード詳細 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="cafe-card bg-cream mb-8"
        >
          <div className="flex items-center mb-4">
            <div className="bg-coffee-light text-cream text-sm px-3 py-1 rounded-full mr-3">
              AI豆知識
            </div>
            <div className="text-sm text-coffee-medium">
              {new Date(card.created_at).toLocaleDateString('ja-JP')}
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-coffee-dark mb-6">
            {card.title || 'タイトルなし'}
          </h1>

          {card.image_url && (
            <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
              <Image
                src={card.image_url}
                alt={card.title}
                fill
                style={{ objectFit: 'cover' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default-card-image.jpg';
                }}
              />
            </div>
          )}

          <div className="prose prose-coffee max-w-none mb-6">
            <p>{card.content || '内容なし'}</p>
          </div>

          {card.tags && card.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {card.tags.map((tag, index) => (
                <Link
                  key={index}
                  href={`/knowledge?tag=${encodeURIComponent(tag)}`}
                  className="inline-block px-3 py-1 bg-wood-light text-coffee-dark rounded-full text-sm hover:bg-wood-medium transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {card.source_post && (
            <div className="mt-8 pt-6 border-t border-wood-light">
              <h3 className="text-lg font-bold text-coffee-dark mb-3">
                元の投稿
              </h3>
              <div className="cafe-card bg-white">
                <div className="flex items-start mb-3">
                  <div className="flex-shrink-0 mr-3">
                    {card.source_post.profiles?.avatar_url ? (
                      <Image
                        src={card.source_post.profiles.avatar_url}
                        alt={card.source_post.profiles.name || 'ユーザー'}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-wood-light flex items-center justify-center text-coffee-dark">
                        {(card.source_post.profiles?.name || 'ユーザー').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-coffee-dark">
                      {card.source_post.profiles?.name || 'ユーザー'}
                    </div>
                    <div className="text-xs text-coffee-medium">
                      {new Date(card.source_post.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                </div>
                <p className="text-coffee-dark">{card.source_post.content}</p>
                <div className="mt-3 text-right">
                  <Link
                    href={`/posts/${card.source_post.id}`}
                    className="text-coffee-medium hover:text-coffee-dark text-sm font-medium"
                  >
                    投稿を見る →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* 関連カード */}
        {relatedCards.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-coffee-dark mb-6">
              関連する知識カード
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedCards.map((relatedCard, index) => (
                <motion.div
                  key={relatedCard.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <KnowledgeCardPreview card={relatedCard} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default KnowledgeCardDetail
