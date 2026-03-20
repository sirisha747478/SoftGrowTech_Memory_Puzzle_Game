import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { getLeaderboard } from '../services/dbService';
import { ScoreEntry, Difficulty, GameMode } from '../types/game';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose, darkMode }) => {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [mode, setMode] = useState<GameMode>('time-attack');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      getLeaderboard(difficulty, mode)
        .then(data => {
          setScores(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Leaderboard error:', err);
          let msg = 'Failed to load scores.';
          try {
            const parsed = JSON.parse(err.message);
            if (parsed.error) msg = parsed.error;
          } catch (e) {
            msg = err.message || msg;
          }
          setError(msg);
          setLoading(false);
        });
    }
  }, [isOpen, difficulty, mode]);

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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black italic flex items-center gap-2">
                <Trophy className="text-emerald-500" /> HALL OF FAME
              </h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
              {(['easy', 'medium', 'hard', 'extreme'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    difficulty === d
                      ? 'bg-emerald-500 text-white'
                      : darkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-500'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <div className="text-center py-12 text-zinc-500 animate-pulse">Loading scores...</div>
              ) : error ? (
                <div className="text-center py-12 text-red-500 italic">{error}</div>
              ) : scores.length > 0 ? (
                scores.map((entry, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-4 rounded-2xl border ${
                      darkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-zinc-500 font-mono font-bold">
                        {i + 1 < 10 ? `0${i + 1}` : i + 1}
                      </span>
                      <div>
                        <p className="font-bold">{entry.playerName}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                          {entry.theme} · {entry.moves} moves
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-emerald-500">{entry.score}</p>
                      <p className="text-[10px] text-zinc-500 font-bold">
                        {entry.date?.toDate ? entry.date.toDate().toLocaleDateString() : new Date(entry.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-zinc-500 italic">No scores recorded yet.</div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Leaderboard;
