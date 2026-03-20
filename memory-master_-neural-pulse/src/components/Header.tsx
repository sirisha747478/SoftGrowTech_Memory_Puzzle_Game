import React from 'react';
import { Brain, Timer, Volume2, VolumeX, Sun, Moon, Play, Pause, User, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { GameState, Difficulty } from '../types/game';
import { GRID_CONFIG } from '../constants/game';

interface HeaderProps {
  gameState: GameState;
  score: number;
  timer: number;
  combo: number;
  difficulty: Difficulty;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  setGameState: (state: GameState) => void;
  onProfileClick: () => void;
  userPhoto?: string;
  isOnline: boolean;
}

const Header: React.FC<HeaderProps> = ({
  gameState,
  score,
  timer,
  combo,
  difficulty,
  soundEnabled,
  setSoundEnabled,
  darkMode,
  setDarkMode,
  setGameState,
  onProfileClick,
  userPhoto,
  isOnline
}) => {
  const timeLimit = GRID_CONFIG[difficulty].timeLimit || 0;
  const isTimeAttack = timeLimit > 0;

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${darkMode ? 'bg-zinc-950/80 border-zinc-800/50' : 'bg-white/80 border-zinc-200'} px-4 sm:px-6 py-4`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Brain className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tight">Memory Master</h1>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Neural Pulse</p>
              {!isOnline && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">
                  <WifiOff className="w-2.5 h-2.5" />
                  <span className="text-[8px] font-bold uppercase">Offline</span>
                </div>
              )}
              {isOnline && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Wifi className="w-2.5 h-2.5" />
                  <span className="text-[8px] font-bold uppercase">Online</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {gameState !== 'menu' && (
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex flex-col items-center sm:items-end">
              <span className="text-[8px] sm:text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Score</span>
              <span className="text-sm sm:text-xl font-mono font-bold text-emerald-500">{score.toString().padStart(5, '0')}</span>
            </div>
            <div className="flex flex-col items-center sm:items-end">
              <span className="text-[8px] sm:text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Time</span>
              <div className={`flex items-center gap-1 text-sm sm:text-xl font-mono font-bold ${isTimeAttack && timer < 20 ? 'text-red-500 animate-pulse' : 'text-zinc-400'}`}>
                <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
                {timer}s
              </div>
            </div>
            <div className="flex flex-col items-center sm:items-end">
              <span className="text-[8px] sm:text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Combo</span>
              <span className={`text-sm sm:text-xl font-mono font-bold ${combo > 0 ? 'text-orange-500' : 'text-zinc-500'}`}>x{combo}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'}`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'}`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {gameState !== 'menu' && (
            <button 
              onClick={() => setGameState(gameState === 'paused' ? 'playing' : 'paused')}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'}`}
            >
              {gameState === 'paused' ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
          )}
          <button 
            onClick={onProfileClick}
            className={`w-8 h-8 rounded-full overflow-hidden border-2 border-emerald-500/30 hover:border-emerald-500 transition-all ml-2`}
          >
            {userPhoto ? (
              <img src={userPhoto} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <User className="w-4 h-4 text-zinc-500" />
              </div>
            )}
          </button>
        </div>
      </div>
      
      {/* Progress Bar */}
      {gameState !== 'menu' && isTimeAttack && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-800">
          <motion.div 
            className={`h-full ${timer < 20 ? 'bg-red-500' : 'bg-emerald-500'}`}
            initial={{ width: '100%' }}
            animate={{ width: `${(timer / timeLimit) * 100}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>
      )}
    </header>
  );
};

export default Header;
