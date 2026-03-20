import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, X, CheckCircle2 } from 'lucide-react';
import { Achievement } from '../types/game';

interface AchievementsProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  achievements: Achievement[];
}

const Achievements: React.FC<AchievementsProps> = ({ isOpen, onClose, darkMode, achievements }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className={`w-full max-w-md p-8 rounded-3xl border ${
              darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            } shadow-2xl`}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black italic flex items-center gap-2">
                <Award className="text-emerald-500" /> ACHIEVEMENTS
              </h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    achievement.unlocked
                      ? darkMode
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-emerald-50 border-emerald-100'
                      : darkMode
                      ? 'bg-zinc-950/50 border-zinc-800 opacity-50 grayscale'
                      : 'bg-zinc-50 border-zinc-100 opacity-50 grayscale'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      achievement.unlocked ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {achievement.icon}
                  </div>
                  <div>
                    <h4 className="font-bold">{achievement.title}</h4>
                    <p className="text-xs text-zinc-500">{achievement.description}</p>
                  </div>
                  {achievement.unlocked && (
                    <div className="ml-auto">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Achievements;
