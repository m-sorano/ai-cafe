import { motion } from 'framer-motion'
import { useState } from 'react'

const BlendSelector = ({ blends, selectedBlend, onSelectBlend }) => {
  return (
    <div className="cafe-card bg-wood-light border border-wood-medium mb-6">
      <h3 className="text-xl font-bold mb-3 text-coffee-dark">ブレンドを選ぶ</h3>
      <p className="text-coffee-medium mb-4">
        興味のあるトピックに合わせたブレンドを選んでください
      </p>
      
      <div className="flex flex-wrap gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectBlend(null)}
          className={`px-4 py-2 rounded-full transition-colors ${
            selectedBlend === null
              ? 'bg-wood-medium text-cream'
              : 'bg-cream text-coffee-dark hover:bg-wood-light'
          }`}
        >
          すべて
        </motion.button>
        
        {blends.map((blend) => {
          return (
            <motion.button
              key={blend.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectBlend(blend.name)}
              className={`px-4 py-2 rounded-full transition-colors ${
                selectedBlend === blend.name
                  ? 'bg-wood-medium text-cream'
                  : 'bg-cream text-coffee-dark hover:bg-wood-light'
              }`}
            >
              {blend.name}
            </motion.button>
          );
        })}
      </div>
    </div>
  )
}

export default BlendSelector
