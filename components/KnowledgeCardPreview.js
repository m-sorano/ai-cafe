import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const KnowledgeCardPreview = ({ card }) => {
  const [isHovered, setIsHovered] = useState(false)
  
  // カードがない場合のフォールバック
  if (!card) {
    return null
  }
  
  // タグの表示を制限（最大3つまで）
  const displayTags = card.tags && Array.isArray(card.tags) 
    ? card.tags.slice(0, 3) 
    : []
  
  return (
    <Link href={`/knowledge/${card.id}`}>
      <motion.div 
        className="cafe-card bg-cream border border-wood-light cursor-pointer transition-all"
        whileHover={{ 
          scale: 1.02,
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center mb-2">
            <div className="bg-coffee-light text-cream text-xs px-2 py-1 rounded-full mr-2">
              AI豆知識
            </div>
            <div className="text-xs text-coffee-medium">
              {new Date(card.created_at).toLocaleDateString('ja-JP')}
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-coffee-dark mb-2 line-clamp-2">
            {card.title || 'タイトルなし'}
          </h3>
          
          <p className="text-sm text-coffee-medium mb-3 flex-grow line-clamp-3">
            {card.content || '内容なし'}
          </p>
          
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto">
              {displayTags.map((tag, index) => (
                <span 
                  key={index}
                  className="text-xs bg-wood-light text-coffee-dark px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
              
              {card.tags && card.tags.length > 3 && (
                <span className="text-xs text-coffee-medium">
                  +{card.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  )
}

export default KnowledgeCardPreview
