# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run build      # Compile TypeScript to dist/
npm run typecheck  # Type-check without emitting
npm run dev        # Watch mode for development
```

To run locally, open `index.html` in a browser (the compiled JS is loaded from `dist/main.js`).

## Architecture

Single-page browser game with no build bundler—TypeScript compiles directly to ES modules. Target audience: second-graders practicing single-digit addition (0-10 + 0-10).

**Source structure:**
- `src/types.ts` - Type definitions: `Problem`, `GameState`, `GameSession`, `PlayerProgress`, `User`, `UsersMap`
- `src/main.ts` - All game logic (state management, UI updates, audio, localStorage persistence)
- `index.html` - Static HTML with all game screens
- `styles.css` - Styling and animations

**Game flow:**
1. Start screen → User selector dropdown for switching/creating users → Play button initializes audio context and starts game
2. Game area shows timed addition problems with 4 answer buttons
3. Timer decreases with level progression (5s base, -0.5s per level, min 2s)
4. Level up after 10 correct answers; lives lost on wrong/timeout
5. Game over → shows stats, saves session to localStorage
6. Progress dashboard displays aggregate stats and session history
7. Leaderboard shows all users ranked by best score

**State persistence (localStorage keys):**
- `mathGameUsers` - Map of all user profiles (id, name, createdAt)
- `mathGameCurrentUser` - Currently selected user ID
- `mathGameBestScore_[userId]` - Per-user high score
- `mathGameSessions_[userId]` - Per-user last 50 game sessions
- `mathGameProgress_[userId]` - Per-user aggregate stats
- `mathGameMuted` - Sound preference (shared across users)

Note: Legacy single-user keys are auto-migrated to the first user on initial load.

**Audio:** Web Audio API oscillator-based sound effects (no audio files).

## Design Constraints

- Vanilla TypeScript only (no frameworks)
- All animations via CSS (no animation libraries)
- Responsive design for tablets (768px+) and desktop
- Large UI elements suitable for children
- No backend/server—localStorage only
- No subtraction, multiplication, or division
- See PRD.md for full requirements
