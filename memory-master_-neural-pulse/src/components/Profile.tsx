import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X, LogOut, Trophy, Clock, Hash, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types/game';
import { logout } from '../services/authService';

interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  profile: UserProfile | null;
}

const Profile: React.FC<ProfileProps> = ({ isOpen, onClose, darkMode, profile }) => {
  if (!profile) return null;

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
                <User className="text-emerald-500" /> PLAYER PROFILE
              </h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 rounded-full border-4 border-emerald-500 p-1 mb-4">
                <img
                  src={profile.photoURL || 'https://picsum.photos/seed/user/200/200'}
                  alt={profile.displayName}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-xl font-black italic">{profile.displayName}</h3>
              <p className="text-zinc-500 text-sm">{profile.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <Trophy className="w-3 h-3" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Best Score</span>
                </div>
                <span className="text-xl font-mono font-bold text-emerald-500">{profile.stats.bestScore}</span>
              </div>
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Wins</span>
                </div>
                <span className="text-xl font-mono font-bold">{profile.stats.wins}</span>
              </div>
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <Hash className="w-3 h-3" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Games</span>
                </div>
                <span className="text-xl font-mono font-bold">{profile.stats.gamesPlayed}</span>
              </div>
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Total Time</span>
                </div>
                <span className="text-xl font-mono font-bold">{Math.floor(profile.stats.totalTime / 60)}m</span>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 border border-red-500/20"
            >
              <LogOut className="w-5 h-5" />
              LOGOUT
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Profile;
