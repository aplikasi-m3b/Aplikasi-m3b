import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Gamepad2, 
  RotateCcw, 
  CheckCircle2, 
  XCircle,
  Trophy, 
  Timer, 
  Clock,
  AlertTriangle,
  Zap, 
  Sparkles,
  ArrowRight,
  HelpCircle,
  FolderCheck,
  Grid3X3,
  Image as ImageIcon,
  Check,
  Shuffle
} from 'lucide-react';
import { ChapterGame, WordScrambleItem, TrueFalseItem, SortCategoryItem, CrosswordClue, ImageMatchItem } from '../types';
import { getCrosswordGridMatrix, GridCell, sanitizeWord } from '../utils/crosswordGenerator';

interface InteractiveGameProps {
  game: ChapterGame;
  onComplete: (score: number) => void;
  previousBestScore?: number;
}

interface MemoryCard {
  cardId: string;
  pairId: string;
  type: 'term' | 'definition';
  text: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const InteractiveGame: React.FC<InteractiveGameProps> = ({
  game,
  onComplete,
  previousBestScore,
}) => {
  // Configured time limit from teacher (minutes to seconds)
  const timeLimitMinutes = game.timeLimitMinutes || 10;
  const totalDurationSeconds = timeLimitMinutes * 60;
  const [timeLeft, setTimeLeft] = useState<number>(totalDurationSeconds);
  const [isTimeExpired, setIsTimeExpired] = useState<boolean>(false);
  const isTimeExpiredRef = useRef(false);

  // General game state
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  // 1. Memory match state
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<MemoryCard[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matches, setMatches] = useState<number>(0);
  const matchesRef = useRef(0);
  matchesRef.current = matches;

  // 2. Speed trivia state
  const [triviaIndex, setTriviaIndex] = useState<number>(0);
  const [triviaScore, setTriviaScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [selectedTriviaOption, setSelectedTriviaOption] = useState<number | null>(null);
  const triviaScoreRef = useRef(0);
  triviaScoreRef.current = triviaScore;

  // 3. Word scramble state
  const [scrambleIndex, setScrambleIndex] = useState<number>(0);
  const [scrambleScore, setScrambleScore] = useState<number>(0);
  const [scrambleInput, setScrambleInput] = useState<string>('');
  const [scrambleFeedback, setScrambleFeedback] = useState<'correct' | 'wrong' | null>(null);
  const scrambleScoreRef = useRef(0);
  scrambleScoreRef.current = scrambleScore;

  // 4. True or False state
  const [tfIndex, setTfIndex] = useState<number>(0);
  const [tfScore, setTfScore] = useState<number>(0);
  const [tfFeedback, setTfFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(null);
  const tfScoreRef = useRef(0);
  tfScoreRef.current = tfScore;

  // 5. Card sort state
  const [sortItemIndex, setSortItemIndex] = useState<number>(0);
  const [sortScore, setSortScore] = useState<number>(0);
  const [sortFeedback, setSortFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [flatSortItems, setFlatSortItems] = useState<{ text: string; categoryName: string }[]>([]);
  const flatSortItemsRef = useRef(flatSortItems);
  flatSortItemsRef.current = flatSortItems;
  const sortScoreRef = useRef(0);
  sortScoreRef.current = sortScore;

  // 6. Crossword (TTS) state
  const [crosswordInputs, setCrosswordInputs] = useState<Record<string, string>>({});
  const crosswordInputsRef = useRef(crosswordInputs);
  crosswordInputsRef.current = crosswordInputs;
  const [selectedClueId, setSelectedClueId] = useState<string | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<'across' | 'down'>('across');
  const [crosswordChecked, setCrosswordChecked] = useState<boolean>(false);
  const [crosswordFeedback, setCrosswordFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null);

  // 7. Image Match state
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedNameId, setSelectedNameId] = useState<string | null>(null);
  const [matchedItemIds, setMatchedItemIds] = useState<string[]>([]);
  const matchedItemIdsRef = useRef(matchedItemIds);
  matchedItemIdsRef.current = matchedItemIds;
  const [shakePair, setShakePair] = useState<boolean>(false);
  const [shuffledImages, setShuffledImages] = useState<ImageMatchItem[]>([]);
  const [shuffledNames, setShuffledNames] = useState<ImageMatchItem[]>([]);

  // Timeout auto submission logic
  const handleTimeOutAutoSubmit = () => {
    if (isTimeExpiredRef.current) return;
    isTimeExpiredRef.current = true;
    setIsTimeExpired(true);

    let calculated = 0;
    if (game.type === 'memory_match') {
      const totalPairs = game.pairs?.length || 4;
      calculated = Math.round((matchesRef.current / totalPairs) * 100);
    } else if (game.type === 'speed_trivia') {
      const qCount = game.triviaQuestions?.length || 2;
      calculated = Math.min(100, Math.round((triviaScoreRef.current / (qCount * 25)) * 100));
    } else if (game.type === 'word_scramble') {
      const wCount = game.scrambleWords?.length || 3;
      calculated = Math.min(100, Math.round((scrambleScoreRef.current / (wCount * 25)) * 100));
    } else if (game.type === 'true_false') {
      const tfCount = game.trueFalseItems?.length || 4;
      calculated = Math.min(100, Math.round((tfScoreRef.current / (tfCount * 20)) * 100));
    } else if (game.type === 'card_sort') {
      const sCount = Math.max(1, flatSortItemsRef.current.length);
      calculated = Math.min(100, Math.round((sortScoreRef.current / (sCount * 20)) * 100));
    } else if (game.type === 'crossword') {
      const clues = game.crosswordConfig?.clues || [];
      let correct = 0;
      let total = 0;
      clues.forEach(clue => {
        const isAcross = clue.direction === 'across';
        for (let i = 0; i < clue.answer.length; i++) {
          const r = isAcross ? clue.row : clue.row + i;
          const c = isAcross ? clue.col + i : clue.col;
          total++;
          if ((crosswordInputsRef.current[`${r},${c}`] || '').toUpperCase() === clue.answer[i]) {
            correct++;
          }
        }
      });
      calculated = total > 0 ? Math.round((correct / total) * (game.crosswordConfig?.totalPoints || 100)) : 50;
    } else if (game.type === 'image_match') {
      const items = game.imageMatchConfig?.items || [];
      const total = Math.max(1, items.length);
      calculated = Math.round((matchedItemIdsRef.current.length / total) * (game.imageMatchConfig?.targetScore || 100));
    }

    finishGameWithScore(calculated, true);
  };

  // Timer effect with countdown rundown
  useEffect(() => {
    let interval: any = null;
    if (timerActive && !isGameOver) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleTimeOutAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, isGameOver]);

  // Initialize Game based on type
  const initGame = () => {
    setIsGameOver(false);
    setIsTimeExpired(false);
    isTimeExpiredRef.current = false;
    setFinalScore(0);
    setSecondsElapsed(0);
    setTimeLeft(totalDurationSeconds);
    setTimerActive(true);

    if (game.type === 'memory_match') {
      const pairs = game.pairs && game.pairs.length > 0 ? game.pairs : [
        { id: 'p1', term: 'Konsep Pokok', definition: 'Intisari materi dasar', topic: 'Materi' },
        { id: 'p2', term: 'Penerapan', definition: 'Aplikasi nyata dalam ibadah/kehidupan', topic: 'Materi' },
        { id: 'p3', term: 'Karakter Madrasah', definition: 'Sikap mulia berakhlak terpuji', topic: 'Materi' },
        { id: 'p4', term: 'Evaluasi', definition: 'Pengukuran hasil belajar tuntas', topic: 'Materi' },
      ];

      const deck: MemoryCard[] = [];
      pairs.forEach((pair, idx) => {
        deck.push({
          cardId: `term-${pair.id}-${idx}`,
          pairId: pair.id,
          type: 'term',
          text: pair.term,
          isFlipped: false,
          isMatched: false,
        });
        deck.push({
          cardId: `def-${pair.id}-${idx}`,
          pairId: pair.id,
          type: 'definition',
          text: pair.definition,
          isFlipped: false,
          isMatched: false,
        });
      });

      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }

      setCards(deck);
      setFlippedCards([]);
      setMoves(0);
      setMatches(0);
    } else if (game.type === 'speed_trivia') {
      setTriviaIndex(0);
      setTriviaScore(0);
      setStreak(0);
      setSelectedTriviaOption(null);
    } else if (game.type === 'word_scramble') {
      setScrambleIndex(0);
      setScrambleScore(0);
      setScrambleInput('');
      setScrambleFeedback(null);
    } else if (game.type === 'true_false') {
      setTfIndex(0);
      setTfScore(0);
      setTfFeedback(null);
    } else if (game.type === 'card_sort') {
      setSortItemIndex(0);
      setSortScore(0);
      setSortFeedback(null);

      // Flatten items from sortCategories
      const flattened: { text: string; categoryName: string }[] = [];
      const cats = game.sortCategories || [];
      cats.forEach(cat => {
        const items = cat.items || [];
        items.forEach(itemText => {
          flattened.push({ text: typeof itemText === 'string' ? itemText : (itemText as any).text || '', categoryName: cat.name || (cat as any).categoryName || '' });
        });
      });

      // Shuffle flattened items
      for (let i = flattened.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flattened[i], flattened[j]] = [flattened[j], flattened[i]];
      }
      setFlatSortItems(flattened);
    } else if (game.type === 'crossword') {
      setCrosswordInputs({});
      setCrosswordChecked(false);
      setCrosswordFeedback(null);
      const firstClue = game.crosswordConfig?.clues?.[0];
      if (firstClue) {
        setSelectedClueId(firstClue.id);
        setSelectedDirection(firstClue.direction);
      } else {
        setSelectedClueId(null);
      }
    } else if (game.type === 'image_match') {
      setSelectedImageId(null);
      setSelectedNameId(null);
      setMatchedItemIds([]);
      setShakePair(false);

      const items = game.imageMatchConfig?.items || [];
      const copyImg = [...items];
      const copyName = [...items];
      for (let i = copyImg.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copyImg[i], copyImg[j]] = [copyImg[j], copyImg[i]];
      }
      for (let i = copyName.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copyName[i], copyName[j]] = [copyName[j], copyName[i]];
      }
      setShuffledImages(copyImg);
      setShuffledNames(copyName);
    }
  };

  useEffect(() => {
    initGame();
  }, [game]);

  const finishGameWithScore = (score: number, autoSubmitted: boolean = false) => {
    const cappedScore = Math.min(100, Math.max(0, Math.round(score)));
    setTimerActive(false);
    setIsGameOver(true);
    setFinalScore(cappedScore);
    if (!autoSubmitted) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    onComplete(cappedScore);
  };

  // --- 1. MEMORY MATCH LOGIC ---
  const handleCardClick = (card: MemoryCard) => {
    if (card.isFlipped || card.isMatched || flippedCards.length >= 2) return;

    const newFlipped = [...flippedCards, card];
    setCards(prev => prev.map(c => c.cardId === card.cardId ? { ...c, isFlipped: true } : c));
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;

      if (first.pairId === second.pairId && first.type !== second.type) {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.pairId === first.pairId ? { ...c, isMatched: true, isFlipped: true } : c
          ));
          setFlippedCards([]);
          const newMatchCount = matches + 1;
          setMatches(newMatchCount);

          const totalPairs = (game.pairs?.length || 4);
          if (newMatchCount >= totalPairs) {
            const baseScore = 100;
            const penalty = Math.max(0, (moves + 1 - totalPairs) * 4) + Math.floor(secondsElapsed * 0.4);
            finishGameWithScore(Math.max(60, baseScore - penalty));
          }
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.cardId === first.cardId || c.cardId === second.cardId ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // --- 2. SPEED TRIVIA LOGIC ---
  const triviaQuestions = game.triviaQuestions && game.triviaQuestions.length > 0 ? game.triviaQuestions : [
    { id: 't1', question: 'Materi bab ini dirancang untuk meningkatkan pemahaman siswa secara tuntas.', options: ['Benar sekali', 'Kurang tepat', 'Salah', 'Tidak berhubungan'], correctIndex: 0, points: 25 },
    { id: 't2', question: 'Setiap siswa madrasah didorong untuk mengamalkan ilmu dengan penuh keikhlasan.', options: ['Benar', 'Salah', 'Ragu-ragu', 'Bukan kewajiban'], correctIndex: 0, points: 25 },
  ];

  const handleTriviaAnswer = (optionIdx: number) => {
    if (selectedTriviaOption !== null) return;
    setSelectedTriviaOption(optionIdx);
    const currentQ = triviaQuestions[triviaIndex];
    const isCorrect = optionIdx === currentQ.correctIndex;

    const points = isCorrect ? (currentQ.points || 20) + streak * 5 : 0;
    const nextScore = triviaScore + points;
    setTriviaScore(nextScore);
    if (isCorrect) setStreak(s => s + 1);
    else setStreak(0);

    setTimeout(() => {
      setSelectedTriviaOption(null);
      if (triviaIndex + 1 < triviaQuestions.length) {
        setTriviaIndex(prev => prev + 1);
      } else {
        const totalMax = triviaQuestions.length * 25;
        const normalized = Math.min(100, Math.round((nextScore / totalMax) * 100));
        finishGameWithScore(normalized);
      }
    }, 1000);
  };

  // --- 3. WORD SCRAMBLE LOGIC ---
  const scrambleWords: WordScrambleItem[] = game.scrambleWords && game.scrambleWords.length > 0 ? game.scrambleWords : [
    { id: 'sw1', word: 'MADRASAH', hint: 'Lembaga pendidikan bernuansa Islami', points: 25 },
    { id: 'sw2', word: 'BELAJAR', hint: 'Aktivitas menuntut ilmu dengan sungguh-sungguh', points: 25 },
    { id: 'sw3', word: 'PRESTASI', hint: 'Capaian hasil belajar terbaik', points: 25 },
    { id: 'sw4', word: 'DISIPLIN', hint: 'Kepatuhan dan ketertiban waktu belajar', points: 25 },
  ];

  const currentScramble = scrambleWords[scrambleIndex] || scrambleWords[0];
  const scrambledDisplay = currentScramble
    ? currentScramble.word.split('').sort(() => 0.5 - Math.random()).join(' ')
    : '';

  const handleCheckScramble = () => {
    if (!scrambleInput.trim() || !currentScramble) return;
    const isCorrect = scrambleInput.trim().toUpperCase() === currentScramble.word.trim().toUpperCase();

    if (isCorrect) {
      setScrambleFeedback('correct');
      const nextScore = scrambleScore + (currentScramble.points || 25);
      setScrambleScore(nextScore);

      setTimeout(() => {
        setScrambleFeedback(null);
        setScrambleInput('');
        if (scrambleIndex + 1 < scrambleWords.length) {
          setScrambleIndex(prev => prev + 1);
        } else {
          const maxPoints = scrambleWords.length * 25;
          const normalized = Math.min(100, Math.round((nextScore / maxPoints) * 100));
          finishGameWithScore(normalized);
        }
      }, 1000);
    } else {
      setScrambleFeedback('wrong');
      setTimeout(() => {
        setScrambleFeedback(null);
      }, 1200);
    }
  };

  // --- 4. TRUE OR FALSE LOGIC ---
  const trueFalseList: TrueFalseItem[] = game.trueFalseItems && game.trueFalseItems.length > 0 ? game.trueFalseItems : [
    { id: 'tf1', statement: 'Materi pembelajaran madrasah mengintegrasikan ilmu pengetahuan dengan akhlak mulia.', isTrue: true, explanation: 'Madrasah menekankan keseimbangan ilmu dunia dan ukhrawi.', points: 25 },
    { id: 'tf2', statement: 'Menuntut ilmu hanya dilakukan saat menghadapi ujian akhir sekolah saja.', isTrue: false, explanation: 'Belajar dan menuntut ilmu adalah proses seumur hidup.', points: 25 },
    { id: 'tf3', statement: 'Membaca materi secara cermat membantu menguasai kompetensi dasar bab.', isTrue: true, explanation: 'Literasi bacaan adalah fondasi pemahaman mendalam.', points: 25 },
    { id: 'tf4', statement: 'Mencontek dan berlaku tidak jujur dibenarkan asalkan memperoleh nilai tinggi.', isTrue: false, explanation: 'Integritas dan kejujuran adalah nilai utama insan madrasah.', points: 25 },
  ];

  const currentTF = trueFalseList[tfIndex];

  const handleTFAnswer = (chosen: boolean) => {
    if (tfFeedback !== null || !currentTF) return;
    const isCorrect = chosen === currentTF.isTrue;
    const pointsWon = isCorrect ? (currentTF.points || 25) : 0;
    const nextScore = tfScore + pointsWon;
    setTfScore(nextScore);

    setTfFeedback({
      isCorrect,
      explanation: currentTF.explanation || (isCorrect ? 'Jawaban Anda Tepat Sekali!' : 'Jawaban Kurang Tepat.')
    });

    setTimeout(() => {
      setTfFeedback(null);
      if (tfIndex + 1 < trueFalseList.length) {
        setTfIndex(prev => prev + 1);
      } else {
        const maxPoints = trueFalseList.length * 25;
        const normalized = Math.min(100, Math.round((nextScore / maxPoints) * 100));
        finishGameWithScore(normalized);
      }
    }, 1500);
  };

  // --- 5. CARD SORT LOGIC ---
  const currentSortItem = flatSortItems[sortItemIndex];
  const sortCategories = game.sortCategories || [
    { id: 'c1', name: 'Konsep Dasar', items: ['Definisi', 'Tujuan'] },
    { id: 'c2', name: 'Penerapan Nyata', items: ['Praktik', 'Tindakan'] }
  ];

  const handleSortAssign = (categoryName: string) => {
    if (sortFeedback !== null || !currentSortItem) return;
    const isCorrect = categoryName.trim().toLowerCase() === currentSortItem.categoryName.trim().toLowerCase();
    const pointsWon = isCorrect ? 20 : 0;
    const nextScore = sortScore + pointsWon;
    setSortScore(nextScore);
    setSortFeedback(isCorrect ? 'correct' : 'wrong');

    setTimeout(() => {
      setSortFeedback(null);
      if (sortItemIndex + 1 < flatSortItems.length) {
        setSortItemIndex(prev => prev + 1);
      } else {
        const totalItems = Math.max(1, flatSortItems.length);
        const normalized = Math.min(100, Math.round((nextScore / (totalItems * 20)) * 100));
        finishGameWithScore(normalized);
      }
    }, 1000);
  };

  // --- 6. TEKA-TEKI SILANG (TTS / CROSSWORD) LOGIC ---
  const crosswordData = useMemo(() => {
    return getCrosswordGridMatrix(game.crosswordConfig?.clues || []);
  }, [game.crosswordConfig]);

  const activeClue = useMemo(() => {
    if (!selectedClueId) return null;
    return game.crosswordConfig?.clues?.find(c => c.id === selectedClueId) || null;
  }, [selectedClueId, game.crosswordConfig]);

  const handleCellKeyDown = (r: number, c: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const key = `${r},${c}`;
      if (crosswordInputs[key]) {
        setCrosswordInputs(prev => ({ ...prev, [key]: '' }));
      } else {
        const prevR = selectedDirection === 'down' ? r - 1 : r;
        const prevC = selectedDirection === 'across' ? c - 1 : c;
        const prevEl = document.getElementById(`tts-cell-${prevR}-${prevC}`) as HTMLInputElement;
        if (prevEl) {
          prevEl.focus();
          setCrosswordInputs(prev => ({ ...prev, [`${prevR},${prevC}`]: '' }));
        }
      }
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      document.getElementById(`tts-cell-${r}-${c + 1}`)?.focus();
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      document.getElementById(`tts-cell-${r}-${c - 1}`)?.focus();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      document.getElementById(`tts-cell-${r + 1}-${c}`)?.focus();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      document.getElementById(`tts-cell-${r - 1}-${c}`)?.focus();
      return;
    }

    if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      const char = e.key.toUpperCase();
      const key = `${r},${c}`;
      setCrosswordInputs(prev => ({ ...prev, [key]: char }));

      // Advance to next cell in current direction
      const nextR = selectedDirection === 'down' ? r + 1 : r;
      const nextC = selectedDirection === 'across' ? c + 1 : c;
      const nextEl = document.getElementById(`tts-cell-${nextR}-${nextC}`) as HTMLInputElement;
      if (nextEl) {
        nextEl.focus();
        nextEl.select();
      }
    }
  };

  const handleCheckCrossword = () => {
    const clues = game.crosswordConfig?.clues || [];
    let correctLetters = 0;
    let totalLetters = 0;
    let correctClues = 0;

    clues.forEach(clue => {
      const isAcross = clue.direction === 'across';
      let clueWordMatch = true;
      for (let i = 0; i < clue.answer.length; i++) {
        const r = isAcross ? clue.row : clue.row + i;
        const c = isAcross ? clue.col + i : clue.col;
        totalLetters++;
        const val = (crosswordInputs[`${r},${c}`] || '').toUpperCase();
        if (val === clue.answer[i]) {
          correctLetters++;
        } else {
          clueWordMatch = false;
        }
      }
      if (clueWordMatch) correctClues++;
    });

    setCrosswordChecked(true);

    const isAllCorrect = correctLetters === totalLetters && totalLetters > 0;
    const earnedScore = totalLetters > 0 
      ? Math.round((correctLetters / totalLetters) * (game.crosswordConfig?.totalPoints || 100))
      : 0;

    if (isAllCorrect) {
      setCrosswordFeedback({
        message: `Luar Biasa! Seluruh ${clues.length} soal Teka-Teki Silang terjawab dengan benar!`,
        isCorrect: true
      });
      setTimeout(() => {
        finishGameWithScore(game.crosswordConfig?.totalPoints || 100);
      }, 1000);
    } else {
      setCrosswordFeedback({
        message: `${correctClues} dari ${clues.length} kata sudah benar (${correctLetters}/${totalLetters} huruf tepat). Skor saat ini: ${earnedScore} Poin.`,
        isCorrect: false
      });
    }
  };

  const handleSelectClue = (clue: CrosswordClue) => {
    setSelectedClueId(clue.id);
    setSelectedDirection(clue.direction);
    const cellEl = document.getElementById(`tts-cell-${clue.row}-${clue.col}`) as HTMLInputElement;
    if (cellEl) {
      cellEl.focus();
      cellEl.select();
    }
  };

  // --- 7. MENJODOHKAN GAMBAR DAN NAMA LOGIC ---
  const imageMatchItems = useMemo(() => {
    return game.imageMatchConfig?.items || [];
  }, [game.imageMatchConfig]);

  const handleSelectImageCard = (id: string) => {
    if (matchedItemIds.includes(id)) return;
    if (selectedNameId) {
      if (selectedNameId === id) {
        const nextMatched = [...matchedItemIds, id];
        setMatchedItemIds(nextMatched);
        setSelectedImageId(null);
        setSelectedNameId(null);

        if (nextMatched.length >= imageMatchItems.length && imageMatchItems.length > 0) {
          finishGameWithScore(game.imageMatchConfig?.targetScore || 100);
        }
      } else {
        setSelectedImageId(id);
        setShakePair(true);
        setTimeout(() => {
          setSelectedImageId(null);
          setSelectedNameId(null);
          setShakePair(false);
        }, 600);
      }
    } else {
      setSelectedImageId(id);
    }
  };

  const handleSelectNameCard = (id: string) => {
    if (matchedItemIds.includes(id)) return;
    if (selectedImageId) {
      if (selectedImageId === id) {
        const nextMatched = [...matchedItemIds, id];
        setMatchedItemIds(nextMatched);
        setSelectedImageId(null);
        setSelectedNameId(null);

        if (nextMatched.length >= imageMatchItems.length && imageMatchItems.length > 0) {
          finishGameWithScore(game.imageMatchConfig?.targetScore || 100);
        }
      } else {
        setSelectedNameId(id);
        setShakePair(true);
        setTimeout(() => {
          setSelectedImageId(null);
          setSelectedNameId(null);
          setShakePair(false);
        }, 600);
      }
    } else {
      setSelectedNameId(id);
    }
  };

  const getGameTypeName = () => {
    switch (game.type) {
      case 'memory_match': return 'Kartu Memori Pasangan';
      case 'speed_trivia': return 'Kuis Kilat Kecepatan';
      case 'word_scramble': return 'Susun Kata Acak';
      case 'true_false': return 'Tantangan Benar / Salah';
      case 'card_sort': return 'Pilah Kategori Konsep';
      case 'crossword': return 'Teka-Teki Silang (TTS)';
      case 'image_match': return 'Menjodohkan Gambar & Nama';
      default: return 'Game Edukasi Interaktif';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      {/* Game Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
              <Gamepad2 className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-slate-900 text-lg">{game.title}</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {getGameTypeName()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{game.instructions}</p>
        </div>

        {/* Real-time stats & Rundown Timer */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Rundown Countdown Timer */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
            timeLeft <= 60 
              ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse ring-2 ring-rose-200' 
              : 'bg-purple-50 border-purple-200 text-purple-900'
          }`}>
            <Clock className={`w-4 h-4 ${timeLeft <= 60 ? 'text-rose-600 animate-bounce' : 'text-purple-700'}`} />
            <span>
              Sisa Waktu: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            <Timer className="w-4 h-4 text-purple-600" />
            <span>Berjalan: {Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60).toString().padStart(2, '0')}</span>
          </div>

          {game.type === 'memory_match' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
              <span>Langkah:</span>
              <strong className="text-purple-700">{moves}</strong>
            </div>
          )}

          {game.type === 'speed_trivia' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Streak: {streak}x</span>
            </div>
          )}

          {previousBestScore !== undefined && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Terbaik: {previousBestScore}</span>
            </div>
          )}
        </div>
      </div>

      {/* Rundown Progress Bar */}
      {!isGameOver && (
        <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${
              timeLeft <= 60 ? 'bg-rose-500' : 'bg-purple-600'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, (timeLeft / totalDurationSeconds) * 100))}%` }}
          />
        </div>
      )}

      {/* Game Content Body */}
      <div className="py-6">
        {isGameOver ? (
          /* Game Over Win Screen */
          <div className="py-8 text-center max-w-md mx-auto animate-in zoom-in-95 duration-200">
            {isTimeExpired ? (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-left text-rose-900 text-xs">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold block">Waktu Habis!</span>
                  Batas waktu pengerjaan game ({timeLimitMinutes} menit) telah berakhir. Jawaban dan skor Anda otomatis dikirim dan tersimpan.
                </div>
              </div>
            ) : null}

            <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Trophy className="w-9 h-9 text-amber-500" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">
              {isTimeExpired ? 'Waktu Selesai & Skor Tersimpan' : 'Luar Biasa! Misi Terselesaikan'}
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              {isTimeExpired 
                ? 'Game telah selesai karena batas waktu pengerjaan berakhir.'
                : 'Anda telah menyelesaikan game pembelajaran edukatif ini dengan gemilang!'}
            </p>

            <div className="my-6 p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-around">
              <div>
                <div className="text-xs text-purple-800 font-medium">Skor Diraih</div>
                <div className="text-2xl font-black text-purple-900">{finalScore}</div>
              </div>
              <div className="w-px h-10 bg-purple-200"></div>
              <div>
                <div className="text-xs text-purple-800 font-medium">Waktu Selesai</div>
                <div className="text-xl font-bold text-purple-900">
                  {Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={initGame}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Main Ulang</span>
              </button>
            </div>
          </div>
        ) : game.type === 'memory_match' ? (
          /* 1. MEMORY MATCH CARDS GRID */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {cards.map((card) => {
              const isMatched = card.isMatched;
              const isFlipped = card.isFlipped;

              return (
                <button
                  key={card.cardId}
                  onClick={() => handleCardClick(card)}
                  disabled={isMatched || isFlipped}
                  className={`min-h-[110px] p-3 rounded-xl text-center flex flex-col items-center justify-center transition duration-200 cursor-pointer text-xs font-medium relative border select-none ${
                    isMatched
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-900 opacity-90 shadow-none'
                      : isFlipped
                      ? 'bg-white border-purple-500 text-slate-900 shadow-md ring-2 ring-purple-400'
                      : 'bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 border-slate-300 text-slate-600 shadow-xs'
                  }`}
                >
                  {isFlipped || isMatched ? (
                    <div>
                      <span className={`inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded mb-1.5 ${
                        card.type === 'term' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {card.type === 'term' ? 'Istilah' : 'Definisi'}
                      </span>
                      <p className="leading-snug text-slate-800 line-clamp-3">
                        {card.text}
                      </p>
                      {isMatched && (
                        <div className="absolute top-2 right-2 text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <Gamepad2 className="w-6 h-6 text-purple-400" />
                      <span className="text-[11px] font-semibold">Buka Kartu</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : game.type === 'speed_trivia' ? (
          /* 2. SPEED TRIVIA */
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Soal {triviaIndex + 1} dari {triviaQuestions.length}</span>
              <span className="font-bold text-slate-800">Skor: {triviaScore}</span>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-600 transition-all duration-300"
                style={{ width: `${((triviaIndex + 1) / triviaQuestions.length) * 100}%` }}
              />
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-base mb-4 leading-snug">
                {triviaQuestions[triviaIndex]?.question}
              </h4>

              <div className="space-y-2.5">
                {triviaQuestions[triviaIndex]?.options.map((opt, oIdx) => {
                  const isSelected = selectedTriviaOption === oIdx;
                  const isCorrect = oIdx === triviaQuestions[triviaIndex].correctIndex;
                  
                  let btnStyle = 'border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 text-slate-800';
                  if (selectedTriviaOption !== null) {
                    if (isCorrect) {
                      btnStyle = 'border-emerald-500 bg-emerald-100 text-emerald-900 font-bold';
                    } else if (isSelected) {
                      btnStyle = 'border-rose-500 bg-rose-100 text-rose-900 font-bold';
                    } else {
                      btnStyle = 'border-slate-200 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleTriviaAnswer(oIdx)}
                      disabled={selectedTriviaOption !== null}
                      className={`w-full text-left p-3 rounded-xl border transition text-sm flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {selectedTriviaOption !== null && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : game.type === 'word_scramble' ? (
          /* 3. WORD SCRAMBLE */
          <div className="max-w-md mx-auto space-y-4 text-center">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Kata {scrambleIndex + 1} dari {scrambleWords.length}</span>
              <span className="font-bold text-slate-800">Skor: {scrambleScore}</span>
            </div>

            <div className="p-6 rounded-2xl bg-sky-50 border border-sky-200 space-y-4">
              <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">
                Susun Huruf Acak Berikut:
              </span>
              <div className="text-2xl font-black text-sky-950 tracking-widest bg-white py-3 px-4 rounded-xl border border-sky-200 shadow-xs">
                {scrambledDisplay}
              </div>

              {currentScramble?.hint && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 bg-sky-100/60 p-2 rounded-lg">
                  <HelpCircle className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <span>Petunjuk: {currentScramble.hint}</span>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <input
                  type="text"
                  value={scrambleInput}
                  onChange={(e) => setScrambleInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckScramble()}
                  placeholder="Ketik jawaban istilah di sini..."
                  className="w-full text-center p-3 rounded-xl border border-slate-300 font-bold text-base uppercase tracking-wider focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />

                {scrambleFeedback === 'correct' && (
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    Benar! Kata tertebak sempurna!
                  </div>
                )}

                {scrambleFeedback === 'wrong' && (
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center gap-1.5 animate-in fade-in">
                    <XCircle className="w-4 h-4" />
                    Belum tepat. Coba periksa susunan hurufnya lagi.
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCheckScramble}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
                >
                  Periksa Jawaban Kata
                </button>
              </div>
            </div>
          </div>
        ) : game.type === 'true_false' ? (
          /* 4. TRUE OR FALSE */
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Pernyataan {tfIndex + 1} dari {trueFalseList.length}</span>
              <span className="font-bold text-slate-800">Skor: {tfScore}</span>
            </div>

            <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-5 text-center">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Tentukan Kebenaran Pernyataan:
              </span>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                "{currentTF?.statement}"
              </h4>

              {tfFeedback ? (
                <div className={`p-4 rounded-xl text-xs font-semibold animate-in fade-in ${
                  tfFeedback.isCorrect ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                  <div className="font-bold text-sm mb-1 flex items-center justify-center gap-1.5">
                    {tfFeedback.isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                    {tfFeedback.isCorrect ? 'Tepat Sekali!' : 'Kurang Tepat!'}
                  </div>
                  <p>{tfFeedback.explanation}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleTFAnswer(true)}
                    className="p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    BENAR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTFAnswer(false)}
                    className="p-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <XCircle className="w-5 h-5" />
                    SALAH
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : game.type === 'card_sort' ? (
          /* 5. CARD SORT */
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Kartu {sortItemIndex + 1} dari {flatSortItems.length || 1}</span>
              <span className="font-bold text-slate-800">Skor: {sortScore}</span>
            </div>

            {currentSortItem ? (
              <div className="p-6 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-5 text-center">
                <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                  Pilah Kartu Konsep ke Kategori yang Tepat:
                </span>
                <div className="p-4 bg-white rounded-xl border border-indigo-200 shadow-xs text-base font-bold text-indigo-950">
                  {currentSortItem.text}
                </div>

                {sortFeedback === 'correct' && (
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    Kategori Tepat!
                  </div>
                )}

                {sortFeedback === 'wrong' && (
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center gap-1.5 animate-in fade-in">
                    <XCircle className="w-4 h-4" />
                    Kategori Kurang Tepat. Kategori benar: {currentSortItem.categoryName}
                  </div>
                )}

                <div className="space-y-2 pt-2 text-left">
                  <label className="block text-xs font-bold text-indigo-900 mb-1">
                    Pilih Wadah Kategori:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sortCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSortAssign(cat.name || (cat as any).categoryName)}
                        disabled={sortFeedback !== null}
                        className="p-3 bg-white hover:bg-indigo-100/70 border border-indigo-300 rounded-xl text-xs font-bold text-indigo-900 transition flex items-center gap-2"
                      >
                        <FolderCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <span className="truncate">{cat.name || (cat as any).categoryName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                Tidak ada kartu konsep yang tersedia untuk dipilah.
              </div>
            )}
          </div>
        ) : game.type === 'crossword' ? (
          /* 6. TEKA-TEKI SILANG (TTS / CROSSWORD) */
          <div className="space-y-5 animate-in fade-in">
            {/* Active Clue Banner */}
            <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {activeClue?.number || '#'}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">
                      {activeClue?.direction === 'across' ? 'Mendatar' : 'Menurun'}
                    </span>
                    <span className="text-xs font-semibold text-purple-900">
                      {activeClue?.answer?.length || 0} Huruf
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    {activeClue?.clue || 'Pilih salah satu soal mendatar atau menurun di bawah untuk mulai mengisi.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={handleCheckCrossword}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Periksa Jawaban TTS</span>
                </button>
              </div>
            </div>

            {/* Crossword Feedback Alert */}
            {crosswordFeedback && (
              <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in ${
                crosswordFeedback.isCorrect
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}>
                {crosswordFeedback.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div className="flex-1">
                  {crosswordFeedback.message}
                </div>
              </div>
            )}

            {/* Grid & Clues Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Crossword Grid Matrix (Column 1-7) */}
              <div className="lg:col-span-7 bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-inner border border-slate-800 overflow-x-auto flex flex-col items-center justify-center min-h-[340px]">
                {crosswordData.rows === 0 ? (
                  <div className="text-slate-400 text-xs py-8 text-center">
                    Belum ada susunan kisi Teka-Teki Silang yang dibuat.
                  </div>
                ) : (
                  <div 
                    className="grid gap-1.5"
                    style={{
                      gridTemplateColumns: `repeat(${crosswordData.cols}, minmax(32px, 38px))`
                    }}
                  >
                    {crosswordData.grid.map((row, rIdx) =>
                      row.map((cell, cIdx) => {
                        if (!cell) {
                          return (
                            <div
                              key={`empty-${rIdx}-${cIdx}`}
                              className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-950/70 rounded-md select-none border border-slate-800/50"
                            />
                          );
                        }

                        const cellKey = `${rIdx},${cIdx}`;
                        const enteredVal = crosswordInputs[cellKey] || '';
                        const isPartOfActiveClue = 
                          (selectedDirection === 'across' && cell.acrossClueId === selectedClueId) ||
                          (selectedDirection === 'down' && cell.downClueId === selectedClueId);

                        let cellStyle = 'bg-white text-slate-900 border-slate-300';
                        if (crosswordChecked) {
                          if (enteredVal.toUpperCase() === cell.char) {
                            cellStyle = 'bg-emerald-100 text-emerald-950 border-emerald-400 font-black';
                          } else if (enteredVal) {
                            cellStyle = 'bg-rose-100 text-rose-950 border-rose-400 font-bold';
                          }
                        } else if (isPartOfActiveClue) {
                          cellStyle = 'bg-purple-100 text-purple-950 border-purple-500 ring-2 ring-purple-400 font-bold';
                        }

                        return (
                          <div
                            key={`cell-${rIdx}-${cIdx}`}
                            className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shadow-2xs transition-all ${cellStyle}`}
                          >
                            {cell.number && (
                              <span className="absolute top-0.5 left-1 text-[9px] font-bold text-slate-500 leading-none select-none pointer-events-none">
                                {cell.number}
                              </span>
                            )}
                            <input
                              id={`tts-cell-${rIdx}-${cIdx}`}
                              type="text"
                              maxLength={1}
                              value={enteredVal}
                              onFocus={() => {
                                if (cell.acrossClueId && selectedDirection === 'across') {
                                  setSelectedClueId(cell.acrossClueId);
                                } else if (cell.downClueId && selectedDirection === 'down') {
                                  setSelectedClueId(cell.downClueId);
                                } else if (cell.acrossClueId) {
                                  setSelectedClueId(cell.acrossClueId);
                                  setSelectedDirection('across');
                                } else if (cell.downClueId) {
                                  setSelectedClueId(cell.downClueId);
                                  setSelectedDirection('down');
                                }
                              }}
                              onChange={(e) => {
                                const val = e.target.value.slice(-1).toUpperCase();
                                if (/^[A-Z]$/.test(val) || val === '') {
                                  setCrosswordInputs(prev => ({ ...prev, [cellKey]: val }));
                                }
                              }}
                              onKeyDown={(e) => handleCellKeyDown(rIdx, cIdx, e)}
                              className="w-full h-full text-center font-mono font-black text-sm uppercase bg-transparent focus:outline-none"
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-3 text-center">
                  * Klik kotak dan ketik huruf. Gunakan tombol panah keyboard atau Backspace untuk berpindah kotak.
                </p>
              </div>

              {/* Clues List Panel (Column 8-12) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Clues Mendatar */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                    Mendatar (Across)
                  </h4>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {game.crosswordConfig?.clues
                      ?.filter(c => c.direction === 'across')
                      .map(clue => {
                        const isSelected = selectedClueId === clue.id;
                        return (
                          <button
                            key={clue.id}
                            type="button"
                            onClick={() => handleSelectClue(clue)}
                            className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-start gap-2.5 ${
                              isSelected
                                ? 'bg-purple-600 text-white font-bold border-purple-600 shadow-xs'
                                : 'bg-white hover:bg-purple-50 text-slate-800 border-slate-200'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              isSelected ? 'bg-white text-purple-700' : 'bg-purple-100 text-purple-900'
                            }`}>
                              {clue.number}
                            </span>
                            <div className="flex-1">
                              <p className="leading-snug">{clue.clue}</p>
                              <span className={`text-[10px] mt-0.5 inline-block ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                                ({clue.answer.length} Huruf)
                              </span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Clues Menurun */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-600 rotate-90" />
                    Menurun (Down)
                  </h4>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {game.crosswordConfig?.clues
                      ?.filter(c => c.direction === 'down')
                      .map(clue => {
                        const isSelected = selectedClueId === clue.id;
                        return (
                          <button
                            key={clue.id}
                            type="button"
                            onClick={() => handleSelectClue(clue)}
                            className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-start gap-2.5 ${
                              isSelected
                                ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-xs'
                                : 'bg-white hover:bg-indigo-50 text-slate-800 border-slate-200'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              isSelected ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-900'
                            }`}>
                              {clue.number}
                            </span>
                            <div className="flex-1">
                              <p className="leading-snug">{clue.clue}</p>
                              <span className={`text-[10px] mt-0.5 inline-block ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                                ({clue.answer.length} Huruf)
                              </span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 7. MENJODOHKAN GAMBAR DAN NAMA (IMAGE MATCH) */
          <div className="space-y-5 animate-in fade-in">
            {/* Image Match Progress Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <ImageIcon className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Jodohkan Gambar dengan Namanya yang Tepat
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Klik satu kartu gambar di sebelah kiri, kemudian klik kartu nama konsep yang sesuai di sebelah kanan!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
                  {matchedItemIds.length} / {imageMatchItems.length} Pasang Cocok
                </span>
              </div>
            </div>

            {/* Two Column Matching Arena */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Image Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-purple-600" />
                  Pilih Kartu Gambar:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(shuffledImages.length > 0 ? shuffledImages : imageMatchItems).map((item) => {
                    const isMatched = matchedItemIds.includes(item.id);
                    const isSelected = selectedImageId === item.id;

                    let cardStyle = 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-xs';
                    if (isMatched) {
                      cardStyle = 'border-emerald-500 bg-emerald-50/70 opacity-80';
                    } else if (isSelected) {
                      cardStyle = 'border-purple-600 bg-purple-50 ring-4 ring-purple-300 scale-[1.02] shadow-md';
                    } else if (shakePair && isSelected) {
                      cardStyle = 'border-rose-500 bg-rose-50 ring-4 ring-rose-300 animate-bounce';
                    }

                    return (
                      <button
                        key={`img-${item.id}`}
                        type="button"
                        disabled={isMatched}
                        onClick={() => handleSelectImageCard(item.id)}
                        className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col items-center justify-between gap-2.5 cursor-pointer select-none relative ${cardStyle}`}
                      >
                        <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center relative">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          {isMatched && (
                            <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[1px] flex items-center justify-center text-white font-bold text-xs gap-1.5">
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              <span>Cocok!</span>
                            </div>
                          )}
                        </div>

                        <div className="w-full flex items-center justify-between text-xs">
                          <span className={`text-[11px] font-bold ${isMatched ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {isMatched ? '✓ Terpasang' : isSelected ? '● Dipilih' : 'Klik untuk Pilih'}
                          </span>
                          {isMatched && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900">
                              {item.name}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Name Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-indigo-600" />
                  Pilih Nama / Konsep yang Sesuai:
                </h4>
                <div className="space-y-2.5">
                  {(shuffledNames.length > 0 ? shuffledNames : imageMatchItems).map((item) => {
                    const isMatched = matchedItemIds.includes(item.id);
                    const isSelected = selectedNameId === item.id;

                    let cardStyle = 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs';
                    if (isMatched) {
                      cardStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                    } else if (isSelected) {
                      cardStyle = 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-300 scale-[1.01] shadow-md';
                    } else if (shakePair && isSelected) {
                      cardStyle = 'border-rose-500 bg-rose-50 ring-4 ring-rose-300 animate-pulse';
                    }

                    return (
                      <button
                        key={`name-${item.id}`}
                        type="button"
                        disabled={isMatched}
                        onClick={() => handleSelectNameCard(item.id)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${cardStyle}`}
                      >
                        <div>
                          <h5 className="text-sm font-bold text-slate-900 leading-snug">
                            {item.name}
                          </h5>
                          {item.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0">
                          {isMatched ? (
                            <span className="p-1.5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            </span>
                          ) : isSelected ? (
                            <span className="p-1.5 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-indigo-700" />
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                              →
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
