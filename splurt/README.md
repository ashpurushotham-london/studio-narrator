# SPLURT

A quick-fire word game: one **pink** card asks for something, one **black** card restricts the word,
and you decide whether you found a word that fits both. Built with React, TypeScript, Vite,
Tailwind CSS v4 and Framer Motion. All progress is saved in `localStorage`.

```bash
cd splurt
npm install
npm run dev        # play at http://localhost:5173
npm test           # engine, scoring, mode and stats tests
npm run build      # type-check + production build into dist/
```

## Modes

| Mode | Rules |
| --- | --- |
| Classic | No timer. A fixed 413-card box; correct / wrong / skipped are tracked. |
| Speed | Countdown (30/60/90/120 s, default 60). Personal best saved. Timer warning at 10 s. |
| Survival | Configurable lives (1-10). Wrong answer = -1 life. Streak bonus every 5. Best score and streak saved. |
| Team | 2-4 named players take turns, independent scores, winner (or tie) at the end. |
| Daily | 12 cards seeded by the local date, so the same set all day. Completion and streak tracked. |

A game can be left at any time ("Save & exit") and resumed from the menu, including after a refresh.
Keyboard: `C`/`→` correct, `W`/`←` wrong, `S`/`↓` skip, `Esc` exit menu.

## Code layout

```
src/
  data/        questions.ts (268 prompts, 12 categories) · restrictions.ts (declarative specs -> 100+ cards)
  logic/       restrictionRules (does a word satisfy a rule) · engine (seeded deck generation)
               modes (per-mode config) · scoring · session (pure reducer-style game logic) · stats
  state/       appReducer + AppContext (settings, stats, session, navigation)
  storage/     localStorage persistence (single place to swap the backend)
  audio/       synthesised Web Audio sound effects (no asset files)
  components/  Cards, CardPair (animations), Controls, TopBar, StatusRow, Logo, Button, Modal ...
  screens/     Menu, Modes, TeamSetup, Game, Results, Stats, Settings, HowTo
```

### Tuning the rules
Scoring and progression live in `src/logic/modes.ts` as plain data per mode: points per outcome,
lives lost, clock bonus/penalty, streak bonuses, and whether a skip breaks a streak.
Lives, speed duration and team turns are player settings (`src/state/types.ts`).

### How challenges stay answerable
Each question carries hidden example answers. `generateDeck` only pairs a question with restrictions
that at least 3 of its example answers satisfy, never repeats a question until all have been dealt,
keeps a restriction out of the last 12 cards, avoids the same restriction family back-to-back, and favours
less-used restrictions. Decks are deterministic for a seed (daily = date, classic = box number).
