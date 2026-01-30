# PRD: Math Speed Challenge - Single Digit Addition

## Introduction

A web-based math learning game designed to help second-graders build speed and fluency with single-digit addition problems (0-10 + 0-10). The game uses engaging gamification elements including lives, levels, rewards, and animations to make practice fun while focusing on quick mental math skills. All data persists locally in the browser using localStorage.

## Goals

- Improve speed and fluency in single-digit addition (sums up to 20)
- Provide an engaging, game-like experience that motivates regular practice
- Track progress and accuracy over time using local storage
- Build confidence in mental math through positive reinforcement

## User Stories

### US-001: Set up project structure and types
**Description:** As a developer, I need the basic project structure and TypeScript types so I can build the game with type safety.

**Acceptance Criteria:**
- [x] Create index.html with basic game container
- [x] Create main.ts with game initialization
- [x] Define types: Problem (num1, num2, answer), GameState (score, lives, level, currentProblem), GameSession (startTime, endTime, score, accuracy, problemsAttempted)
- [x] Define PlayerProgress type (totalGames, avgAccuracy, bestScore, recentSessions)
- [x] Typecheck passes

### US-002: Implement problem generation
**Description:** As a player, I need random addition problems so I can practice single-digit math skills.

**Acceptance Criteria:**
- [x] Function generateProblem() returns Problem with num1 and num2 between 0-10
- [x] Function generates correct answer as num1 + num2
- [x] Function generateAnswerOptions(correctAnswer) returns array of 4 unique options including correct answer
- [x] Wrong answers are within ±3 of correct answer (plausible distractors)
- [x] Typecheck passes

### US-003: Create main game UI layout
**Description:** As a player, I need a clear game interface so I can see the problem and answer options.

**Acceptance Criteria:**
- [x] Problem display area showing "X + Y = ?"
- [x] Four answer buttons in a 2x2 grid
- [x] Score display (top left)
- [x] Lives display with 3 heart icons (top right)
- [x] Level indicator (top center)
- [x] Large, colorful buttons suitable for children
- [x] Responsive design: works on tablets (768px+) and desktop
- [x] Typecheck passes
- [x] Verify changes work in browser

### US-004: Implement answer selection handling
**Description:** As a player, I need to select answers and see immediate feedback so I know if I'm correct.

**Acceptance Criteria:**
- [x] Clicking answer button checks if answer matches correct answer
- [x] Correct: button turns green, score increases by 10 points
- [x] Wrong: button turns red, correct answer highlights green, lose 1 life
- [x] All buttons disabled for 1 second after selection
- [x] Next problem loads automatically after 1 second delay
- [x] Typecheck passes
- [x] Verify changes work in browser

### US-005: Add game state management
**Description:** As a player, I need the game to track my progress during a session.

**Acceptance Criteria:**
- [x] GameState initialized with score=0, lives=3, level=1, correctCount=0, totalAttempts=0
- [x] State updates on correct answer: score +10, correctCount +1, totalAttempts +1
- [x] State updates on wrong answer: lives -1, totalAttempts +1
- [x] Game ends when lives reach 0
- [x] Typecheck passes
- [x] Verify changes work in browser

### US-006: Implement speed bonus scoring
**Description:** As a player, I want bonus points for fast answers so I'm motivated to improve my speed.

**Acceptance Criteria:**
- [x] Timer starts when problem displays (5 second base timer)
- [x] Answer within 1 second: +5 bonus points
- [x] Answer within 2 seconds: +3 bonus points
- [x] Answer within 3 seconds: +1 bonus point
- [x] Timer runs out (5 seconds): counts as wrong answer, lose 1 life
- [x] Visual timer bar shows remaining time
- [x] Typecheck passes
- [x] Verify changes work in browser

### US-007: Add correct/wrong answer animations
**Description:** As a player, I need visual feedback animations so the game feels engaging and responsive.

**Acceptance Criteria:**
- [x] Correct answer: button pulses green, "+10" text floats up and fades
- [x] Wrong answer: button shakes horizontally, screen flashes red briefly
- [x] Life lost: heart icon breaks/fades animation
- [x] Use CSS animations (no external animation libraries)
- [x] Typecheck passes
- [x] Verify changes work in browser

### US-008: Create level progression system
**Description:** As a player, I need levels so I feel progression and have increasing challenges.

**Acceptance Criteria:**
- [x] Advance to next level after 10 correct answers
- [x] Level 2: timer reduced to 4.5 seconds
- [x] Level 3: timer reduced to 4 seconds
- [x] Each subsequent level: timer reduces by 0.5 seconds (minimum 2 seconds)
- [x] Level up: display "Level X!" message for 2 seconds
- [x] Display progress bar showing X/10 correct for current level
- [x] Typecheck passes
- [x] Verify changes work in browser

### US-009: Add milestone celebrations
**Description:** As a player, I want celebrations at milestones so I feel rewarded for progress.

**Acceptance Criteria:**
- [x] 10 correct in a row: "Great job!" message with star burst animation
- [x] 25 correct in a row: "Amazing!" message with confetti effect (CSS-based)
- [x] New high score: "New Record!" banner at game end
- [x] Use CSS animations only (no external libraries)
- [x] Typecheck passes
- [x] Verify changes work in browser

### US-010: Implement game over screen
**Description:** As a player, I need to see my results and restart so I can play again and try to beat my score.

**Acceptance Criteria:**
- [x] Game over screen shows: final score, level reached, accuracy percentage, problems attempted
- [x] Display "Play Again" button
- [x] Display "View Progress" button
- [x] Clicking "Play Again" resets game state and starts new game
- [x] Typecheck passes
- [x] Verify changes work in browser

### US-011: Persist game sessions to localStorage
**Description:** As a player, I need my game history saved so I can track improvement over time.

**Acceptance Criteria:**
- [x] On game end: save GameSession to localStorage array "mathGameSessions"
- [x] GameSession includes: date, score, level, accuracy, problemsAttempted
- [x] Keep last 50 sessions (delete oldest when exceeded)
- [x] Update PlayerProgress aggregate: totalGames, avgAccuracy, bestScore
- [x] Typecheck passes
- [x] Verify changes work in browser

### US-012: Create progress dashboard view
**Description:** As a player (or parent looking over shoulder), I need to see progress over time.

**Acceptance Criteria:**
- [x] Dashboard accessible from game over screen or start screen
- [x] Shows: total games played, overall accuracy %, best score, current streak (consecutive days played)
- [x] List of last 10 sessions with date, score, accuracy
- [x] "Back to Game" button returns to start screen
- [x] Typecheck passes
- [x] Verify changes work in browser

### US-013: Add sound effects
**Description:** As a player, I need audio feedback so the game feels more engaging and responsive.

**Acceptance Criteria:**
- [x] Correct answer: short positive chime
- [x] Wrong answer: gentle buzz (not harsh or scary)
- [x] Level up: ascending celebratory tone
- [x] Game over: soft ending sound
- [x] Mute button in corner, state persisted to localStorage
- [x] Sounds are short (<1 second) and use Web Audio API or small audio files
- [x] Typecheck passes
- [x] Verify changes work in browser

### US-014: Add start screen
**Description:** As a player, I need a start screen so I can begin when ready and access settings.

**Acceptance Criteria:**
- [x] Start screen with game title "Math Speed Challenge"
- [x] Large "Play" button to start game
- [x] "View Progress" button to open dashboard
- [x] Sound toggle button
- [x] Shows best score if exists
- [x] Typecheck passes
- [x] Verify changes work in browser

## Non-Goals

- No multiplayer or social features
- No subtraction, multiplication, or division operations
- No carrying/regrouping problems (stays within single digits)
- No login system or user accounts (localStorage only, single device)
- No backend server or database
- No advanced analytics or exportable reports
- No in-app purchases or monetization
- No background music (only sound effects)

## Technical Considerations

- Vanilla TypeScript compiled to JavaScript (no framework)
- All persistence via localStorage (no backend)
- Responsive design optimized for tablets (768px+) and desktop
- Large, colorful UI appropriate for young children (large fonts, big buttons)
- All animations via CSS (no external animation libraries)
- Sound via Web Audio API or small embedded audio files
