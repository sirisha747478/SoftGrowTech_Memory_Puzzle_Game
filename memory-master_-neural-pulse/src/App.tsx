import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  RotateCcw, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  Lightbulb,
  Award,
  Calendar,
  Hash,
  LogIn
} from 'lucide-react';

// --- Services & Hooks ---
import { loginWithGoogle, subscribeToAuthChanges } from './services/authService';
import { getUserProfile, saveScore, updateUserStats, testConnection } from './services/dbService';
import { useGame } from './hooks/useGame';

// --- Components ---
import Header from './components/Header';
import Card from './components/Card';
import Leaderboard from './components/Leaderboard';
import Achievements from './components/Achievements';
import Profile from './components/Profile';

// --- Constants & Types ---
import { GRID_CONFIG } from './constants/game';
import { Difficulty, Theme, GameMode, UserProfile, Achievement } from './types/game';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-8 text-center">
          <div className="max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4 italic uppercase">System Error</h2>
            <p className="text-zinc-400 mb-8">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-emerald-500 text-zinc-950 font-bold rounded-xl hover:bg-emerald-400 transition-all"
            >
              RELOAD SYSTEM
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  // User & Auth State
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // UI State
  const [darkMode, setDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Game Settings
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [theme, setTheme] = useState<Theme>('icons');
  const [mode, setMode] = useState<GameMode>('time-attack');

  // Login State
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Audio Refs
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    const sounds = {
      flip: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      match: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
      wrong: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3',
      win: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
      lose: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
      click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    };

    Object.entries(sounds).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.volume = 0.4;
      audioRefs.current[key] = audio;
    });

    const unsubscribe = subscribeToAuthChanges(async (u) => {
      setUser(u);
      if (u) {
        const p = await getUserProfile(u.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setIsAuthReady(true);
    });

    const checkConnection = async () => {
      const online = await testConnection();
      setIsOnline(online);
    };
    checkConnection();

    return () => unsubscribe();
  }, []);

  const playSound = useCallback((type: string) => {
    if (!soundEnabled) return;
    const sound = audioRefs.current[type];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }, [soundEnabled]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error('Login error:', error);
      let message = 'Failed to sign in with Google.';
      
      if (error.code === 'auth/popup-blocked') {
        message = 'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in was cancelled. Please try again to track your progress.';
      } else if (error.code === 'auth/auth-domain-config-required') {
        message = 'The authentication domain is not correctly configured. Please check your Firebase settings.';
      } else if (error.code === 'auth/unauthorized-domain') {
        message = `This domain (${window.location.hostname}) is not authorized for authentication. Please add it to the "Authorized domains" in your Firebase Console (Authentication > Settings).`;
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Google Sign-In is not enabled for this project. Please enable it in the Firebase Console (Authentication > Sign-in method).';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection and try again.';
      } else {
        message = error.message || message;
      }
      
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGameWin = async (finalScore: number) => {
    playSound('win');
    if (user) {
      const scoreEntry = {
        playerName: profile?.displayName || 'Anonymous',
        score: finalScore,
        difficulty,
        mode,
        theme,
        moves,
        date: new Date().toISOString()
      };
      await saveScore(scoreEntry);
      await updateUserStats(user.uid, {
        bestScore: finalScore,
        totalMoves: moves,
        totalTime: GRID_CONFIG[difficulty].timeLimit ? GRID_CONFIG[difficulty].timeLimit! - timer : timer,
        wins: 1
      });
      // Refresh profile
      const p = await getUserProfile(user.uid);
      setProfile(p);
    }
  };

  const handleGameLose = () => {
    playSound('lose');
  };

  const {
    gameState,
    setGameState,
    cards,
    matchedPairs,
    moves,
    score,
    timer,
    combo,
    hintsRemaining,
    isProcessing,
    initGame,
    handleCardClick,
    useHint
  } = useGame({
    difficulty,
    theme,
    mode,
    playerName: profile?.displayName || 'Guest',
    onGameWin: handleGameWin,
    onGameLose: handleGameLose,
    playSound
  });

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'} font-sans selection:bg-emerald-500/30`}>
        <Header 
          gameState={gameState}
          score={score}
          timer={timer}
          combo={combo}
          difficulty={difficulty}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          setGameState={setGameState}
          onProfileClick={() => setShowProfile(true)}
          userPhoto={profile?.photoURL}
          isOnline={isOnline}
        />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <AnimatePresence mode="wait">
            {!user ? (
              <motion.div 
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto text-center py-20"
              >
                <h2 className="text-4xl font-black mb-6 italic">NEURAL PULSE</h2>
                <p className="text-zinc-500 mb-12">Synchronize your cognitive patterns. Sign in to track your progress and compete globally.</p>
                <button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className={`w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all flex items-center justify-center gap-3 text-lg shadow-xl shadow-emerald-500/20 ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoggingIn ? (
                    <RotateCcw className="w-6 h-6 animate-spin" />
                  ) : (
                    <LogIn className="w-6 h-6" />
                  )}
                  {isLoggingIn ? 'SYNCHRONIZING...' : 'SIGN IN WITH GOOGLE'}
                </button>
                {loginError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-center gap-3"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-left">{loginError}</p>
                  </motion.div>
                )}
              </motion.div>
            ) : gameState === 'menu' ? (
              <motion.div 
                key="menu"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-2xl mx-auto"
              >
                <div className="text-center mb-12">
                  <h2 className="text-4xl sm:text-6xl font-black mb-4 tracking-tighter italic">NEURAL PULSE</h2>
                  <p className="text-zinc-500 font-medium">Welcome back, {profile?.displayName}. Ready to test your limits?</p>
                </div>

                <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'} shadow-2xl`}>
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Difficulty Level</label>
                        <div className="flex flex-wrap gap-2">
                          {(['easy', 'medium', 'hard', 'extreme'] as Difficulty[]).map(d => (
                            <button
                              key={d}
                              onClick={() => setDifficulty(d)}
                              className={`flex-1 py-3 px-4 rounded-xl border font-bold capitalize transition-all ${
                                difficulty === d 
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                  : darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300'
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Visual Theme</label>
                        <div className="flex flex-wrap gap-2">
                          {(['icons', 'animals', 'emojis', 'abstract'] as Theme[]).map(t => (
                            <button
                              key={t}
                              onClick={() => setTheme(t)}
                              className={`flex-1 py-3 px-4 rounded-xl border font-bold capitalize transition-all ${
                                theme === t 
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                  : darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => initGame(false)}
                        className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all flex items-center justify-center gap-3 text-lg shadow-xl shadow-emerald-500/20"
                      >
                        <Play className="w-6 h-6 fill-current" />
                        INITIALIZE GAME
                      </button>
                      <button 
                        onClick={() => initGame(true)}
                        className={`flex-1 py-5 border-2 transition-all flex items-center justify-center gap-3 text-lg font-black rounded-2xl ${
                          darkMode 
                            ? 'bg-zinc-950 border-zinc-800 text-emerald-500 hover:border-emerald-500/50' 
                            : 'bg-zinc-50 border-zinc-200 text-emerald-600 hover:border-emerald-500/50'
                        }`}
                      >
                        <Calendar className="w-6 h-6" />
                        DAILY CHALLENGE
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setShowLeaderboard(true)}
                        className={`py-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                          darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                        }`}
                      >
                        <Trophy className="w-5 h-5" />
                        LEADERBOARD
                      </button>
                      <button 
                        onClick={() => setShowAchievements(true)}
                        className={`py-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                          darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                        }`}
                      >
                        <Award className="w-5 h-5" />
                        ACHIEVEMENTS
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative"
              >
                <div 
                  className="grid gap-2 sm:gap-4 mx-auto"
                  style={{ 
                    gridTemplateColumns: `repeat(${GRID_CONFIG[difficulty].cols}, minmax(0, 1fr))`,
                    maxWidth: '900px'
                  }}
                >
                  {cards.map(card => (
                    <Card 
                      key={card.id} 
                      card={card} 
                      theme={theme}
                      onClick={handleCardClick}
                      disabled={gameState !== 'playing'}
                      darkMode={darkMode}
                    />
                  ))}
                </div>

                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  <button 
                    onClick={useHint}
                    disabled={hintsRemaining <= 0 || gameState !== 'playing' || isProcessing}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl border font-bold transition-all ${
                      darkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-300'
                    } disabled:opacity-50`}
                  >
                    <Lightbulb className={`w-5 h-5 ${hintsRemaining > 0 ? 'text-yellow-400' : 'text-zinc-500'}`} />
                    Hint ({hintsRemaining})
                  </button>
                  <button 
                    onClick={() => initGame()}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl border font-bold transition-all ${
                      darkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <RotateCcw className="w-5 h-5 text-zinc-400" />
                    Restart
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game Over Modal */}
          <AnimatePresence>
            {(gameState === 'won' || gameState === 'lost') && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/90 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className={`p-8 rounded-3xl max-w-lg w-full border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-2xl relative overflow-hidden`}
                >
                  <div className={`absolute top-0 left-0 w-full h-2 ${gameState === 'won' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <div className="text-center">
                    <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 ${
                      gameState === 'won' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
                    }`}>
                      {gameState === 'won' ? <Trophy className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                    </div>
                    <h2 className="text-3xl font-black mb-2 tracking-tight italic">
                      {gameState === 'won' ? 'NEURAL SYNC COMPLETE' : 'SYSTEM FAILURE'}
                    </h2>
                    <p className="text-zinc-500 font-medium mb-8">
                      {gameState === 'won' 
                        ? `Excellent focus, ${profile?.displayName}. You've mastered the ${difficulty} grid.` 
                        : 'Time has expired. Your cognitive patterns were too slow this time.'}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                        <span className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Final Score</span>
                        <span className="text-2xl font-mono font-bold text-emerald-500">{score}</span>
                      </div>
                      <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                        <span className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Accuracy</span>
                        <span className="text-2xl font-mono font-bold">
                          {moves > 0 ? Math.round(((GRID_CONFIG[difficulty].rows * GRID_CONFIG[difficulty].cols / 2) / moves) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => initGame()}
                        className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
                      >
                        <RotateCcw className="w-5 h-5" />
                        PLAY AGAIN
                      </button>
                      <button 
                        onClick={() => setGameState('menu')}
                        className={`flex-1 py-4 font-bold rounded-2xl border transition-all ${
                          darkMode ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-600'
                        }`}
                      >
                        MAIN MENU
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer Stats */}
        {gameState === 'playing' && (
          <footer className={`fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 sm:gap-8 px-6 sm:px-8 py-4 backdrop-blur-md border rounded-2xl shadow-2xl z-40 ${
            darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white/50 border-zinc-200'
          }`}>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-zinc-500" />
              <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider">Moves: {moves}</span>
            </div>
            <div className="w-px h-4 bg-zinc-800" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-zinc-500" />
              <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider">
                {matchedPairs} / {(GRID_CONFIG[difficulty].rows * GRID_CONFIG[difficulty].cols) / 2}
              </span>
            </div>
            <div className="w-px h-4 bg-zinc-800" />
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-zinc-500" />
              <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider">Hints: {hintsRemaining}</span>
            </div>
          </footer>
        )}

        {/* Modals */}
        <Leaderboard isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} darkMode={darkMode} />
        <Achievements isOpen={showAchievements} onClose={() => setShowAchievements(false)} darkMode={darkMode} achievements={profile?.achievements || []} />
        <Profile isOpen={showProfile} onClose={() => setShowProfile(false)} darkMode={darkMode} profile={profile} />
      </div>
    </ErrorBoundary>
  );
}
