import { GameState, GameSession, PlayerProgress, Problem } from './types';

const initialGameState: GameState = {
  score: 0,
  lives: 3,
  level: 1,
  currentProblem: null,
  correctCount: 0,
  totalAttempts: 0,
  levelCorrectCount: 0,
  streak: 0,
};

let gameState: GameState = { ...initialGameState };

function generateProblem(): Problem {
  const num1 = Math.floor(Math.random() * 11);
  const num2 = Math.floor(Math.random() * 11);
  return {
    num1,
    num2,
    answer: num1 + num2,
  };
}

function generateAnswerOptions(correctAnswer: number): number[] {
  const options: Set<number> = new Set([correctAnswer]);

  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 7) - 3;
    if (offset === 0) continue;
    const wrongAnswer = correctAnswer + offset;
    if (wrongAnswer >= 0 && wrongAnswer <= 20) {
      options.add(wrongAnswer);
    }
  }

  return Array.from(options).sort(() => Math.random() - 0.5);
}

let currentOptions: number[] = [];
let buttonsDisabled = false;
let problemStartTime: number = 0;
let timerInterval: number | null = null;
const BASE_TIMER_SECONDS = 5;
const CORRECT_PER_LEVEL = 10;
const STREAK_MILESTONE_1 = 10;
const STREAK_MILESTONE_2 = 25;
const LOCAL_STORAGE_BEST_SCORE_KEY = 'mathGameBestScore';
const LOCAL_STORAGE_SESSIONS_KEY = 'mathGameSessions';
const LOCAL_STORAGE_PROGRESS_KEY = 'mathGameProgress';
const MAX_SESSIONS = 50;
const LOCAL_STORAGE_MUTE_KEY = 'mathGameMuted';

let gameStartTime: number = 0;
let audioContext: AudioContext | null = null;
let isMuted = false;
let cameFromGameOver = false;

function initAudio(): void {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  isMuted = localStorage.getItem(LOCAL_STORAGE_MUTE_KEY) === 'true';
  updateMuteButtonUI();
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3): void {
  if (isMuted || !audioContext) return;

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playCorrectSound(): void {
  if (isMuted || !audioContext) return;
  // Ascending two-note chime
  playTone(523, 0.15, 'sine', 0.25); // C5
  setTimeout(() => playTone(659, 0.2, 'sine', 0.25), 100); // E5
}

function playWrongSound(): void {
  if (isMuted || !audioContext) return;
  // Gentle low buzz
  playTone(180, 0.3, 'triangle', 0.2);
}

function playLevelUpSound(): void {
  if (isMuted || !audioContext) return;
  // Ascending celebratory arpeggio
  playTone(523, 0.15, 'sine', 0.2); // C5
  setTimeout(() => playTone(659, 0.15, 'sine', 0.2), 100); // E5
  setTimeout(() => playTone(784, 0.15, 'sine', 0.2), 200); // G5
  setTimeout(() => playTone(1047, 0.3, 'sine', 0.25), 300); // C6
}

function playGameOverSound(): void {
  if (isMuted || !audioContext) return;
  // Soft descending tone
  playTone(392, 0.25, 'sine', 0.2); // G4
  setTimeout(() => playTone(330, 0.25, 'sine', 0.2), 200); // E4
  setTimeout(() => playTone(262, 0.4, 'sine', 0.15), 400); // C4
}

function toggleMute(): void {
  isMuted = !isMuted;
  localStorage.setItem(LOCAL_STORAGE_MUTE_KEY, String(isMuted));
  updateMuteButtonUI();
}

function updateMuteButtonUI(): void {
  const muteBtn = document.getElementById('mute-btn');
  if (muteBtn) {
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', isMuted ? 'Unmute sounds' : 'Mute sounds');
  }
}

function setupMuteButton(): void {
  const muteBtn = document.getElementById('mute-btn');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      if (!audioContext) {
        initAudio();
      }
      toggleMute();
    });
  }
}

function getTimerDuration(): number {
  const reduction = (gameState.level - 1) * 0.5;
  return Math.max(2, BASE_TIMER_SECONDS - reduction);
}

function updateUI(): void {
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const num1El = document.getElementById('num1');
  const num2El = document.getElementById('num2');
  const answerBtns = document.querySelectorAll('.answer-btn');

  if (scoreEl) scoreEl.textContent = String(gameState.score);
  if (levelEl) levelEl.textContent = String(gameState.level);

  if (gameState.currentProblem) {
    if (num1El) num1El.textContent = String(gameState.currentProblem.num1);
    if (num2El) num2El.textContent = String(gameState.currentProblem.num2);

    currentOptions = generateAnswerOptions(gameState.currentProblem.answer);
    answerBtns.forEach((btn, index) => {
      btn.textContent = String(currentOptions[index]);
      (btn as HTMLButtonElement).classList.remove('correct', 'wrong');
    });
  }

  updateLivesDisplay();
  updateLevelProgress();
}

function updateLivesDisplay(): void {
  const hearts = document.querySelectorAll('#lives-display .heart');
  hearts.forEach((heart, index) => {
    const heartEl = heart as HTMLElement;
    if (index < gameState.lives) {
      heartEl.style.opacity = '1';
      heartEl.classList.remove('lost');
    } else {
      heartEl.style.opacity = '0.2';
    }
  });
}

function startTimer(): void {
  problemStartTime = Date.now();
  const timerBar = document.getElementById('timer-bar');
  const timerFill = document.getElementById('timer-fill');
  const timerDuration = getTimerDuration();

  if (timerBar) timerBar.classList.remove('hidden');
  if (timerFill) timerFill.style.width = '100%';

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = window.setInterval(() => {
    const elapsed = (Date.now() - problemStartTime) / 1000;
    const remaining = timerDuration - elapsed;
    const percent = Math.max(0, (remaining / timerDuration) * 100);

    if (timerFill) timerFill.style.width = `${percent}%`;

    if (remaining <= 0) {
      stopTimer();
      handleTimeOut();
    }
  }, 50);
}

function stopTimer(): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function handleTimeOut(): void {
  if (buttonsDisabled || !gameState.currentProblem) return;

  buttonsDisabled = true;
  gameState.totalAttempts += 1;
  gameState.lives -= 1;
  gameState.streak = 0;
  playWrongSound();
  animateHeartLost();
  showScreenFlash();

  const correctAnswer = gameState.currentProblem.answer;
  const answerBtns = document.querySelectorAll('.answer-btn');

  answerBtns.forEach((btn, index) => {
    if (currentOptions[index] === correctAnswer) {
      btn.classList.add('correct');
    }
  });

  updateLivesDisplay();

  setTimeout(() => {
    if (gameState.lives <= 0) {
      showGameOver();
    } else {
      loadNextProblem();
    }
  }, 1000);
}

function calculateSpeedBonus(responseTimeMs: number): number {
  const seconds = responseTimeMs / 1000;
  if (seconds <= 1) return 5;
  if (seconds <= 2) return 3;
  if (seconds <= 3) return 1;
  return 0;
}

function showFloatingScore(points: number, button: HTMLButtonElement): void {
  const floatingEl = document.createElement('div');
  floatingEl.className = 'floating-score';
  floatingEl.textContent = `+${points}`;

  const rect = button.getBoundingClientRect();
  floatingEl.style.left = `${rect.left + rect.width / 2 - 20}px`;
  floatingEl.style.top = `${rect.top}px`;

  document.body.appendChild(floatingEl);

  setTimeout(() => {
    floatingEl.remove();
  }, 1000);
}

function showScreenFlash(): void {
  const flash = document.createElement('div');
  flash.className = 'screen-flash';
  document.body.appendChild(flash);

  setTimeout(() => {
    flash.remove();
  }, 300);
}

function animateHeartLost(): void {
  const hearts = document.querySelectorAll('#lives-display .heart');
  const lostHeartIndex = gameState.lives;
  if (lostHeartIndex >= 0 && lostHeartIndex < hearts.length) {
    const heart = hearts[lostHeartIndex] as HTMLElement;
    heart.classList.add('lost');
  }
}

function updateLevelProgress(): void {
  const progressFill = document.getElementById('level-progress-fill');
  const progressText = document.getElementById('level-progress-text');

  if (progressFill) {
    const percent = (gameState.levelCorrectCount / CORRECT_PER_LEVEL) * 100;
    progressFill.style.width = `${percent}%`;
  }

  if (progressText) {
    progressText.textContent = `${gameState.levelCorrectCount}/${CORRECT_PER_LEVEL}`;
  }
}

function showLevelUpMessage(): void {
  const levelUpEl = document.getElementById('level-up-message');
  const levelUpText = document.getElementById('level-up-text');

  if (levelUpEl && levelUpText) {
    levelUpText.textContent = `Level ${gameState.level}!`;
    levelUpEl.classList.remove('hidden');
    levelUpEl.style.animation = 'none';
    levelUpEl.offsetHeight;
    levelUpEl.style.animation = '';
    playLevelUpSound();

    setTimeout(() => {
      levelUpEl.classList.add('hidden');
    }, 2000);
  }
}

function checkLevelUp(): void {
  if (gameState.levelCorrectCount >= CORRECT_PER_LEVEL) {
    gameState.level += 1;
    gameState.levelCorrectCount = 0;
    showLevelUpMessage();
    updateLevelProgress();
    const levelEl = document.getElementById('level');
    if (levelEl) levelEl.textContent = String(gameState.level);
  }
}

function getBestScore(): number {
  const stored = localStorage.getItem(LOCAL_STORAGE_BEST_SCORE_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

function saveBestScore(score: number): void {
  localStorage.setItem(LOCAL_STORAGE_BEST_SCORE_KEY, String(score));
}

function getSessions(): GameSession[] {
  const stored = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as GameSession[];
  } catch {
    return [];
  }
}

function saveSession(session: GameSession): void {
  const sessions = getSessions();
  sessions.push(session);

  if (sessions.length > MAX_SESSIONS) {
    sessions.shift();
  }

  localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
}

function getPlayerProgress(): PlayerProgress {
  const stored = localStorage.getItem(LOCAL_STORAGE_PROGRESS_KEY);
  if (!stored) {
    return {
      totalGames: 0,
      avgAccuracy: 0,
      bestScore: 0,
      recentSessions: [],
    };
  }
  try {
    return JSON.parse(stored) as PlayerProgress;
  } catch {
    return {
      totalGames: 0,
      avgAccuracy: 0,
      bestScore: 0,
      recentSessions: [],
    };
  }
}

function updatePlayerProgress(session: GameSession): void {
  const progress = getPlayerProgress();

  progress.totalGames += 1;

  if (session.score > progress.bestScore) {
    progress.bestScore = session.score;
  }

  const sessions = getSessions();
  const validSessions = sessions.filter(s => typeof s.accuracy === 'number');
  const totalAccuracy = validSessions.reduce((sum, s) => sum + s.accuracy, 0);
  progress.avgAccuracy = validSessions.length > 0 ? Math.round(totalAccuracy / validSessions.length) : 0;

  progress.recentSessions = sessions.slice(-10);

  localStorage.setItem(LOCAL_STORAGE_PROGRESS_KEY, JSON.stringify(progress));
}

function showMilestoneMessage(message: string): void {
  const milestoneEl = document.getElementById('milestone-message');
  const milestoneText = document.getElementById('milestone-text');

  if (milestoneEl && milestoneText) {
    milestoneText.textContent = message;
    milestoneEl.classList.remove('hidden');
    milestoneEl.style.animation = 'none';
    milestoneEl.offsetHeight;
    milestoneEl.style.animation = '';

    const stars = milestoneEl.querySelectorAll('.star');
    stars.forEach((star) => {
      const starEl = star as HTMLElement;
      starEl.style.animation = 'none';
      starEl.offsetHeight;
      starEl.style.animation = '';
    });

    setTimeout(() => {
      milestoneEl.classList.add('hidden');
    }, 2500);
  }
}

function showConfetti(): void {
  const container = document.getElementById('confetti-container');
  if (!container) return;

  container.classList.remove('hidden');
  container.innerHTML = '';

  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe'];

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
    container.appendChild(confetti);
  }

  setTimeout(() => {
    container.classList.add('hidden');
    container.innerHTML = '';
  }, 3500);
}

function showNewRecordBanner(): void {
  const banner = document.getElementById('new-record-banner');
  if (banner) {
    banner.classList.remove('hidden');
    banner.style.animation = 'none';
    banner.offsetHeight;
    banner.style.animation = '';

    setTimeout(() => {
      banner.classList.add('hidden');
    }, 3000);
  }
}

function checkStreakMilestone(): void {
  if (gameState.streak === STREAK_MILESTONE_1) {
    showMilestoneMessage('Great job!');
  } else if (gameState.streak === STREAK_MILESTONE_2) {
    showMilestoneMessage('Amazing!');
    showConfetti();
  }
}

function loadNextProblem(): void {
  if (gameState.totalAttempts === 0) {
    gameStartTime = Date.now();
  }
  buttonsDisabled = false;
  gameState.currentProblem = generateProblem();
  updateUI();
  startTimer();
}

function handleAnswerClick(selectedAnswer: number, clickedBtn: HTMLButtonElement): void {
  if (buttonsDisabled || !gameState.currentProblem) return;

  buttonsDisabled = true;
  stopTimer();

  const responseTime = Date.now() - problemStartTime;
  const correctAnswer = gameState.currentProblem.answer;
  const isCorrect = selectedAnswer === correctAnswer;
  const answerBtns = document.querySelectorAll('.answer-btn');

  gameState.totalAttempts += 1;

  if (isCorrect) {
    clickedBtn.classList.add('correct');
    const basePoints = 10;
    const speedBonus = calculateSpeedBonus(responseTime);
    const totalPoints = basePoints + speedBonus;
    gameState.score += totalPoints;
    gameState.correctCount += 1;
    gameState.levelCorrectCount += 1;
    gameState.streak += 1;
    playCorrectSound();
    showFloatingScore(totalPoints, clickedBtn);
    updateLevelProgress();
    checkLevelUp();
    checkStreakMilestone();
  } else {
    clickedBtn.classList.add('wrong');
    gameState.lives -= 1;
    gameState.streak = 0;
    playWrongSound();
    animateHeartLost();
    showScreenFlash();
    answerBtns.forEach((btn, index) => {
      if (currentOptions[index] === correctAnswer) {
        btn.classList.add('correct');
      }
    });
    updateLivesDisplay();
  }

  const scoreEl = document.getElementById('score');
  if (scoreEl) scoreEl.textContent = String(gameState.score);

  setTimeout(() => {
    if (gameState.lives <= 0) {
      showGameOver();
    } else {
      loadNextProblem();
    }
  }, 1000);
}

function setupAnswerButtons(): void {
  const answerBtns = document.querySelectorAll('.answer-btn');
  answerBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const selectedAnswer = currentOptions[index];
      handleAnswerClick(selectedAnswer, btn as HTMLButtonElement);
    });
  });
}

function showGameOver(): void {
  stopTimer();
  playGameOverSound();
  const timerBar = document.getElementById('timer-bar');
  if (timerBar) timerBar.classList.add('hidden');

  const gameArea = document.getElementById('game-area');
  const gameOverScreen = document.getElementById('game-over-screen');
  const finalScoreEl = document.getElementById('final-score');
  const finalLevelEl = document.getElementById('final-level');
  const finalAttemptsEl = document.getElementById('final-attempts');
  const finalAccuracyEl = document.getElementById('final-accuracy');

  if (gameArea) gameArea.classList.add('hidden');
  if (gameOverScreen) gameOverScreen.classList.remove('hidden');

  if (finalScoreEl) finalScoreEl.textContent = String(gameState.score);
  if (finalLevelEl) finalLevelEl.textContent = String(gameState.level);
  if (finalAttemptsEl) finalAttemptsEl.textContent = String(gameState.totalAttempts);

  const accuracy = gameState.totalAttempts > 0
    ? Math.round((gameState.correctCount / gameState.totalAttempts) * 100)
    : 0;
  if (finalAccuracyEl) finalAccuracyEl.textContent = String(accuracy);

  const bestScore = getBestScore();
  if (gameState.score > bestScore) {
    saveBestScore(gameState.score);
    showNewRecordBanner();
  }

  const session: GameSession = {
    startTime: gameStartTime,
    endTime: Date.now(),
    score: gameState.score,
    accuracy: accuracy,
    problemsAttempted: gameState.totalAttempts,
    level: gameState.level,
    date: new Date().toISOString(),
  };
  saveSession(session);
  updatePlayerProgress(session);
}

function hideGameOver(): void {
  const gameArea = document.getElementById('game-area');
  const gameOverScreen = document.getElementById('game-over-screen');

  if (gameArea) gameArea.classList.remove('hidden');
  if (gameOverScreen) gameOverScreen.classList.add('hidden');
}

function setupPlayAgainButton(): void {
  const playAgainBtn = document.getElementById('play-again-btn');
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
      gameState = { ...initialGameState };
      hideGameOver();
      loadNextProblem();
    });
  }
}

function setupViewProgressButton(): void {
  const viewProgressBtn = document.getElementById('view-progress-btn');
  if (viewProgressBtn) {
    viewProgressBtn.addEventListener('click', () => {
      cameFromGameOver = true;
      showProgressDashboard();
    });
  }
}

function calculateDayStreak(): number {
  const sessions = getSessions();
  if (sessions.length === 0) return 0;

  const playDates = new Set<string>();
  sessions.forEach(session => {
    const date = new Date(session.date);
    playDates.add(date.toDateString());
  });

  const sortedDates = Array.from(playDates)
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const mostRecentPlay = sortedDates[0];
  mostRecentPlay.setHours(0, 0, 0, 0);

  if (mostRecentPlay.getTime() !== today.getTime() && mostRecentPlay.getTime() !== yesterday.getTime()) {
    return 0;
  }

  let streak = 1;
  let currentDate = mostRecentPlay;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    prevDate.setHours(0, 0, 0, 0);

    const checkDate = sortedDates[i];
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate.getTime() === prevDate.getTime()) {
      streak++;
      currentDate = checkDate;
    } else if (checkDate.getTime() < prevDate.getTime()) {
      break;
    }
  }

  return streak;
}

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${month}/${day} ${displayHours}:${minutes} ${ampm}`;
}

function renderProgressDashboard(): void {
  const progress = getPlayerProgress();
  const sessions = getSessions();
  const dayStreak = calculateDayStreak();

  const totalGamesEl = document.getElementById('stat-total-games');
  const accuracyEl = document.getElementById('stat-accuracy');
  const bestScoreEl = document.getElementById('stat-best-score');
  const dayStreakEl = document.getElementById('stat-day-streak');
  const sessionsListEl = document.getElementById('sessions-list');

  if (totalGamesEl) totalGamesEl.textContent = String(progress.totalGames);
  if (accuracyEl) accuracyEl.textContent = `${progress.avgAccuracy}%`;
  if (bestScoreEl) bestScoreEl.textContent = String(progress.bestScore);
  if (dayStreakEl) dayStreakEl.textContent = String(dayStreak);

  if (sessionsListEl) {
    sessionsListEl.innerHTML = '';
    const recentSessions = sessions.slice(-10).reverse();

    if (recentSessions.length === 0) {
      sessionsListEl.innerHTML = '<p class="no-sessions">No sessions yet</p>';
    } else {
      recentSessions.forEach(session => {
        const sessionEl = document.createElement('div');
        sessionEl.className = 'session-row';
        sessionEl.innerHTML = `
          <span class="session-date">${formatSessionDate(session.date)}</span>
          <span class="session-score">Score: ${session.score}</span>
          <span class="session-accuracy">${session.accuracy}%</span>
        `;
        sessionsListEl.appendChild(sessionEl);
      });
    }
  }
}

function showProgressDashboard(): void {
  const gameOverScreen = document.getElementById('game-over-screen');
  const progressScreen = document.getElementById('progress-screen');

  renderProgressDashboard();
  if (gameOverScreen) gameOverScreen.classList.add('hidden');
  if (progressScreen) progressScreen.classList.remove('hidden');
}

function hideProgressDashboard(): void {
  const progressScreen = document.getElementById('progress-screen');
  if (progressScreen) progressScreen.classList.add('hidden');
}

function setupBackToGameButton(): void {
  const backToGameBtn = document.getElementById('back-to-game-btn');
  if (backToGameBtn) {
    backToGameBtn.addEventListener('click', () => {
      hideProgressDashboard();
      if (cameFromGameOver) {
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) gameOverScreen.classList.remove('hidden');
        cameFromGameOver = false;
      } else {
        showStartScreen();
      }
    });
  }
}

function showStartScreen(): void {
  const startScreen = document.getElementById('start-screen');
  const gameHeader = document.getElementById('game-header');
  const gameArea = document.getElementById('game-area');
  const gameOverScreen = document.getElementById('game-over-screen');
  const progressScreen = document.getElementById('progress-screen');

  if (startScreen) startScreen.classList.remove('hidden');
  if (gameHeader) gameHeader.classList.add('hidden');
  if (gameArea) gameArea.classList.add('hidden');
  if (gameOverScreen) gameOverScreen.classList.add('hidden');
  if (progressScreen) progressScreen.classList.add('hidden');

  const bestScore = getBestScore();
  const bestScoreDisplay = document.getElementById('best-score-display');
  const startBestScore = document.getElementById('start-best-score');

  if (bestScore > 0 && bestScoreDisplay && startBestScore) {
    startBestScore.textContent = String(bestScore);
    bestScoreDisplay.classList.remove('hidden');
  } else if (bestScoreDisplay) {
    bestScoreDisplay.classList.add('hidden');
  }
}

function hideStartScreen(): void {
  const startScreen = document.getElementById('start-screen');
  const gameHeader = document.getElementById('game-header');
  const gameArea = document.getElementById('game-area');

  if (startScreen) startScreen.classList.add('hidden');
  if (gameHeader) gameHeader.classList.remove('hidden');
  if (gameArea) gameArea.classList.remove('hidden');
}

function startGame(): void {
  gameState = { ...initialGameState };
  hideStartScreen();
  loadNextProblem();
}

function setupStartScreenButtons(): void {
  const startPlayBtn = document.getElementById('start-play-btn');
  const startProgressBtn = document.getElementById('start-progress-btn');

  if (startPlayBtn) {
    startPlayBtn.addEventListener('click', () => {
      if (!audioContext) {
        initAudio();
      }
      startGame();
    });
  }

  if (startProgressBtn) {
    startProgressBtn.addEventListener('click', () => {
      const startScreen = document.getElementById('start-screen');
      if (startScreen) startScreen.classList.add('hidden');
      renderProgressDashboard();
      const progressScreen = document.getElementById('progress-screen');
      if (progressScreen) progressScreen.classList.remove('hidden');
    });
  }
}

function initGame(): void {
  initAudio();
  setupAnswerButtons();
  setupPlayAgainButton();
  setupViewProgressButton();
  setupBackToGameButton();
  setupMuteButton();
  setupStartScreenButtons();
  showStartScreen();
  console.log('Math Speed Challenge initialized');
}

document.addEventListener('DOMContentLoaded', initGame);

export { gameState, initGame, generateProblem, generateAnswerOptions };
