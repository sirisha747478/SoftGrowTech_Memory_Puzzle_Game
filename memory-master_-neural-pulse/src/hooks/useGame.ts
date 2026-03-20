import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Card, 
  Difficulty, 
  Theme, 
  GameState, 
  ScoreEntry, 
  Achievement, 
  GameMode,
  GridConfig
} from '../types/game';
import { GRID_CONFIG, THEME_DATA } from '../constants/game';
import { saveScore, getLeaderboard } from '../services/dbService';

interface UseGameProps {
  difficulty: Difficulty;
  theme: Theme;
  mode: GameMode;
  playerName: string;
  isDailyChallenge?: boolean;
  onGameWin?: (score: number) => void;
  onGameLose?: () => void;
  playSound?: (type: string) => void;
}

export const useGame = ({
  difficulty,
  theme,
  mode,
  playerName,
  isDailyChallenge = false,
  onGameWin,
  onGameLose,
  playSound
}: UseGameProps) => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [hintsRemaining, setHintsRemaining] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const config = GRID_CONFIG[difficulty];

  const initGame = useCallback((isDaily: boolean = false) => {
    const currentConfig = GRID_CONFIG[difficulty];
    const themeItems = THEME_DATA[theme];
    const pairCount = (currentConfig.rows * currentConfig.cols) / 2;
    
    // Select random items from theme
    const selectedItems = [...themeItems]
      .sort(() => Math.random() - 0.5)
      .slice(0, pairCount);

    // Create pairs and shuffle
    const gameCards: Card[] = [...selectedItems, ...selectedItems]
      .sort(() => Math.random() - 0.5)
      .map((content, index) => ({
        id: index,
        content,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(gameCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setScore(0);
    setTimer(currentConfig.timeLimit || 0);
    setCombo(0);
    setHintsRemaining(currentConfig.hints);
    setGameState('playing');
    setIsProcessing(false);

    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (mode === 'time-attack' || isDailyChallenge) {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setGameState('lost');
            onGameLose?.();
            return 0;
          }
          return prev - 1;
        }
        return prev + 1;
      });
    }, 1000);

    playSound?.('click');
  }, [difficulty, theme, mode, onGameLose, playSound]);

  const handleCardClick = useCallback((id: number) => {
    if (
      isProcessing || 
      flippedCards.length === 2 || 
      cards[id].isFlipped || 
      cards[id].isMatched || 
      gameState !== 'playing'
    ) return;

    playSound?.('flip');

    setCards(prev => {
      const next = [...prev];
      next[id] = { ...next[id], isFlipped: true };
      return next;
    });

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsProcessing(true);
      setMoves(prev => prev + 1);

      const [firstId, secondId] = newFlipped;
      if (cards[firstId].content === cards[secondId].content) {
        // Match found
        setTimeout(() => {
          setCards(prev => {
            const next = [...prev];
            next[firstId] = { ...next[firstId], isMatched: true };
            next[secondId] = { ...next[secondId], isMatched: true };
            return next;
          });
          setFlippedCards([]);
          setMatchedPairs(prev => {
            const next = prev + 1;
            if (next === (config.rows * config.cols) / 2) {
              if (timerRef.current) clearInterval(timerRef.current);
              setGameState('won');
              onGameWin?.(score);
            }
            return next;
          });
          
          // Calculate score
          const comboBonus = combo * 50;
          const timeBonus = mode === 'time-attack' ? timer * 10 : 0;
          const baseScore = 100;
          setScore(prev => prev + baseScore + comboBonus + timeBonus);
          setCombo(prev => prev + 1);
          setIsProcessing(false);
          playSound?.('match');
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => {
            const next = [...prev];
            next[firstId] = { ...next[firstId], isFlipped: false };
            next[secondId] = { ...next[secondId], isFlipped: false };
            return next;
          });
          setFlippedCards([]);
          setCombo(0);
          setIsProcessing(false);
          playSound?.('wrong');
        }, 1000);
      }
    }
  }, [cards, flippedCards, gameState, isProcessing, config, score, combo, timer, mode, onGameWin, playSound]);

  const useHint = useCallback(() => {
    if (hintsRemaining <= 0 || isProcessing || gameState !== 'playing') return;

    const unmatchedCards = cards.filter(c => !c.isMatched && !c.isFlipped);
    if (unmatchedCards.length < 2) return;

    // Find a pair to show
    const firstCard = unmatchedCards[Math.floor(Math.random() * unmatchedCards.length)];
    const secondCard = cards.find(c => c.content === firstCard.content && c.id !== firstCard.id);

    if (firstCard && secondCard) {
      setHintsRemaining(prev => prev - 1);
      setIsProcessing(true);

      setCards(prev => {
        const next = [...prev];
        next[firstCard.id] = { ...next[firstCard.id], isFlipped: true };
        next[secondCard.id] = { ...next[secondCard.id], isFlipped: true };
        return next;
      });

      setTimeout(() => {
        setCards(prev => {
          const next = [...prev];
          next[firstCard.id] = { ...next[firstCard.id], isFlipped: false };
          next[secondCard.id] = { ...next[secondCard.id], isFlipped: false };
          return next;
        });
        setIsProcessing(false);
      }, 1500);
    }
  }, [cards, hintsRemaining, isProcessing, gameState]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
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
  };
};
