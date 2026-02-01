# Multi-User System Implementation Plan

Add multi-user system to the math game, enabling multiple players to have separate progress tracking while competing on a shared leaderboard. This includes user creation/deletion, per-user stats storage, data migration from single-user to multi-user, and a leaderboard screen.

## Context

- **Files involved:**
  - `src/types.ts` (add User, UsersMap types)
  - `src/main.ts` (user management logic, per-user storage, leaderboard)
  - `index.html` (user selector UI, create/delete modals, leaderboard screen)
  - `styles.css` (styling for new UI elements)
- **Related patterns:**
  - localStorage keys follow `mathGame[Feature]` format
  - UI screens use `hidden` class for visibility
  - Modal patterns can follow the existing milestone/level-up message approach
  - Functions for get/save/update follow existing patterns (getBestScore, saveBestScore, etc.)
- **Dependencies:** None (vanilla TypeScript, no external dependencies)

## Implementation Approach

- **Testing approach:** Manual browser testing (no test framework in project)
- Complete each task fully before moving to the next
- Run `npm run typecheck` after TypeScript changes
- Verify UI changes in browser after HTML/CSS modifications

---

## Task 1: Add User types and localStorage key constants

**Files:**
- Modify: `src/types.ts`
- Modify: `src/main.ts`

**Steps:**
- [x] Add `User` interface with `id` (string), `name` (string), `createdAt` (number)
- [x] Add `UsersMap` type as `Record<string, User>`
- [x] Add `LOCAL_STORAGE_USERS_KEY` and `LOCAL_STORAGE_CURRENT_USER_KEY` constants to main.ts
- [x] Run `npm run typecheck` - must pass

---

## Task 2: Implement user management functions

**Files:**
- Modify: `src/main.ts`

**Steps:**
- [x] Add `getUsers()` function to load UsersMap from localStorage
- [x] Add `saveUsers(users: UsersMap)` function
- [x] Add `getCurrentUserId()` function (returns first user ID if none selected)
- [x] Add `setCurrentUserId(id: string)` function
- [x] Add `createUser(name: string)` function (generates `user_timestamp` ID)
- [x] Add `deleteUser(id: string)` function (prevents deletion of last user)
- [x] Run `npm run typecheck` - must pass

---

## Task 3: Create data migration function for existing single-user data

**Files:**
- Modify: `src/main.ts`

**Steps:**
- [x] Add `migrateToMultiUser()` function
- [x] Check if users already exist (skip migration if present)
- [x] Read existing `mathGameBestScore`, `mathGameSessions`, `mathGameProgress`
- [x] Create "Player 1" user with migrated data using user-specific keys
- [x] Clear old single-user keys after successful migration
- [x] Call `migrateToMultiUser()` in `initGame()`
- [x] Run `npm run typecheck` - must pass
- [x] Verify migration works in browser (check localStorage)

---

## Task 4: Update storage functions to be per-user

**Files:**
- Modify: `src/main.ts`

**Steps:**
- [x] Modify `getBestScore()` to use `mathGameBestScore_[userId]` format
- [x] Modify `saveBestScore()` to use user-specific key
- [x] Modify `getSessions()` to use `mathGameSessions_[userId]` format
- [x] Modify `saveSession()` to use user-specific key
- [x] Modify `getPlayerProgress()` to use `mathGameProgress_[userId]` format
- [x] Modify `updatePlayerProgress()` to use user-specific key
- [x] Update all callers to use `getCurrentUserId()`
- [x] Run `npm run typecheck` - must pass
- [x] Verify existing game flow still works in browser

---

## Task 5: Add user selector HTML and create user modal

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

**Steps:**
- [x] Add `user-selector` div to start-screen (above Play button)
- [x] Add select dropdown for user selection
- [x] Add "New User" button next to dropdown
- [x] Add "Delete User" button
- [x] Add `create-user-modal` div with name input, Create and Cancel buttons
- [x] Add `delete-confirm-modal` div with confirmation message, Delete and Cancel buttons
- [x] Style all new elements to match existing large, kid-friendly UI
- [x] Verify layout looks correct in browser

---

## Task 6: Wire up user selector and management logic

**Files:**
- Modify: `src/main.ts`

**Steps:**
- [x] Add `populateUserSelector()` function to fill dropdown with users
- [x] Add event listener for user selector change (update current user, refresh UI)
- [x] Add event listener for "New User" button (show create modal)
- [x] Add event listener for create modal Cancel button (hide modal)
- [x] Add event listener for create modal Create button (validate name, create user, hide modal, refresh selector)
- [x] Add event listener for "Delete User" button (show confirm modal with username)
- [x] Add event listener for delete modal Cancel button (hide modal)
- [x] Add event listener for delete modal Delete button (delete user, switch user if needed, hide modal, refresh selector)
- [x] Call `populateUserSelector()` in `initGame()`
- [x] Update `showStartScreen()` to refresh user selector and show current user's best score
- [x] Run `npm run typecheck` - must pass
- [x] Verify user creation, selection, and deletion work in browser

---

## Task 7: Add leaderboard screen

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/main.ts`

**Steps:**
- [x] Add "Leaderboard" button to start-screen
- [x] Add `leaderboard-screen` div (hidden by default) with title, list container, and Back button
- [x] Style leaderboard to match existing game UI (rank, username, score columns)
- [x] Add `getLeaderboardData()` function (load all users with best scores, sort descending)
- [x] Add `renderLeaderboard()` function (populate list with rank, name, score)
- [x] Add `showLeaderboard()` and `hideLeaderboard()` functions
- [x] Wire up Leaderboard button and Back button
- [x] Run `npm run typecheck` - must pass
- [x] Verify leaderboard displays correctly in browser

---

## Task 8: Update progress dashboard for current user

**Files:**
- Modify: `src/main.ts`
- Modify: `index.html`

**Steps:**
- [x] Update progress-screen to show current username in header
- [x] Update `renderProgressDashboard()` to load stats for current user only
- [x] Update `calculateDayStreak()` to use current user's sessions
- [x] Verify progress dashboard shows current user's data correctly in browser
- [x] Run `npm run typecheck` - must pass

---

## Final Verification

- [x] Create multiple users and verify each has separate stats
- [x] Play games with different users and verify scores save separately
- [x] Verify leaderboard shows all users sorted by best score
- [x] Verify migration works when upgrading from single-user data
- [x] Verify cannot delete last remaining user
- [x] Run `npm run build` to ensure production build works
- [x] Run `npm run typecheck` one final time

---

## Post-Implementation

- [x] Move this plan to `docs/plans/completed/`
