import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Card as CardType, Theme } from '../types/game';
import { ICON_MAP } from '../constants/game';

interface CardProps {
  card: CardType;
  theme: Theme;
  onClick: (id: number) => void;
  disabled: boolean;
  darkMode: boolean;
}

const Card: React.FC<CardProps> = ({ card, theme, onClick, disabled, darkMode }) => {
  const isIconTheme = theme === 'icons';
  const IconComponent = isIconTheme ? ICON_MAP[card.content] : null;

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={!disabled && !card.isFlipped && !card.isMatched ? { scale: 1.05 } : {}}
      whileTap={!disabled && !card.isFlipped && !card.isMatched ? { scale: 0.95 } : {}}
      onClick={() => !disabled && onClick(card.id)}
      className={`relative aspect-square cursor-pointer transition-all duration-300 ${
        card.isMatched ? 'opacity-0 scale-90 pointer-events-none' : ''
      }`}
    >
      <div className="w-full h-full relative preserve-3d">
        {/* Front Side (Face Down) */}
        <motion.div
          animate={{ rotateY: card.isFlipped ? 180 : 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className={`absolute inset-0 w-full h-full backface-hidden rounded-xl border-2 flex items-center justify-center shadow-lg ${
            darkMode 
              ? 'bg-zinc-900 border-zinc-800 text-emerald-500/20' 
              : 'bg-white border-zinc-100 text-emerald-500/10'
          }`}
        >
          <div className="w-1/2 h-1/2 border-2 border-current rounded-full flex items-center justify-center">
            <div className="w-1/2 h-1/2 bg-current rounded-full" />
          </div>
        </motion.div>

        {/* Back Side (Face Up) */}
        <motion.div
          initial={{ rotateY: 180 }}
          animate={{ rotateY: card.isFlipped ? 0 : -180 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className={`absolute inset-0 w-full h-full backface-hidden rounded-xl border-2 flex items-center justify-center shadow-xl ${
            darkMode 
              ? 'bg-zinc-800 border-emerald-500/30 text-emerald-400' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-600'
          }`}
        >
          {isIconTheme && IconComponent ? (
            <IconComponent className="w-1/2 h-1/2" />
          ) : (
            <span className="text-3xl sm:text-4xl select-none">{card.content}</span>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default memo(Card);
