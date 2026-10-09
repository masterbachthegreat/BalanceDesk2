# BalanceDesk: notes for working on this repo

Electron desktop game (Windows target). A Telegram-like UI where the player answers customers' finance, accounting,
stats and maths questions; OpenRouter LLMs play the customers (Haiku), grade answers and act as mentor (Sonnet).

## Layout

- `electron/main.js`: window plus the IPC handler `bd` that whitelists backend calls.
  - `preload.js` exposes `window.api`.
  - `backend.js`: JSON saves in `userData/save`, settings (API key encrypted via `safeStorage`), the OpenRouter client, and the usage log.
  - `mock-llm.js`: a fake LLM, used when `BD_MOCK_LLM=1`.
- `src/` is the renderer: plain ES modules, no bundler.
  - `js/core/`: `expr.js` (safe evaluator plus financial functions), `state.js` (global `S`, debounced saves), `bus.js`, `format.js`, `api-web.js` (browser shim for the dev server).
  - `js/game/`:
    - `customers.js`: arrival, read delay, typing, impatience, Haiku prompt. A hidden anger value (`cs.anger`, tuned by `config.customer.meter`) sets the customer's tone and VIP grace. The user doesn't want a visible meter.
    - `concept.js`: the 📖 Concept lesson (Sonnet, cached per chat)
    - `results.js`, `grading.js` (Sonnet prompt), `payout.js`: ending a chat
    - `bot.js`: slash commands, `/payout`
    - `mentor.js`: Sonnet, `@chatN` transcripts, chart blocks, unprompted hints after repeated pushbacks (`maybeMentorHint`), Review with mentor
    - `manager.js`, `progress.js`: ranks and promotion
    - `shop.js`, `questions.js` (pick by book order), `template.js` (randomised questions), `clock.js` (in-app clock; time only runs while the app is open)
  - `js/ui/`: sidebar, chatview (incremental message rendering), modals, contextmenu, drawer, floating (calculator, notepad), charts (Chart.js, vendored in `src/vendor`), markdown.
  - Game modules reach UI only through `ui/registry.js`, which avoids import cycles.
- `data/`: every tunable is JSON. See README for the table.
- `scripts/`:
  - `dev-server.js`: serves the renderer in a browser with the same backend.
  - `validate-data.mjs`: checks data, runs every template against the book's numbers, and samples 200 variants of each.
  - `build-personalities.py`: regenerates `data/personalities.json`.
  - `question-sources/`: Python sources that generate `data/questions/*.json`.
- `tests/ui-test.mjs`: Playwright end-to-end test against the dev server with the mock LLM (41 checks).

## Question pool

- The questions come from the exercises in the user's book *Economies, Accounts and Money*. The PDF is in the repo root and is not packaged.
- Each question is rewritten as a self-contained customer message with a reference solution. The grader is told the solution may be incomplete.
- Edit `scripts/question-sources/rankNN.py`, run `python3 scripts/question-sources/rankNN.py`, then `npm run validate`.
- Templates: `vars` (`{min,max,step}` or `{choices}`), `compute` (expressions evaluated in order), `constraints`, and `check` (the book's values plus expected results).
  - Placeholders are `{name}`, `{name:2}`, `{=expr:fmt}`, and conditional text `{?expr|yes|no}`.
  - Formats are `N` (decimals), `sN` (significant digits), `int`, `pct` and `money`.
- Ranks 1–8 (chapters 1–37) are live.
  - Rank 9 (chapters 38–42) is drafted in `scripts/question-sources/drafts/rank09.py` but not enabled. It still has two validator errors: c39-e05 needs DD < 2.8, and c41-e08 needs |S−K| ≤ 10.
  - Ranks 10–11 (chapters 43–52) are not written yet.
  - `progress.maxRank()` caps promotion at the highest rank that has questions, so adding a `data/questions/rankNN_*.json` opens the next rank automatically.
  - To extract a chapter's exercises: `pdftotext -layout` on the PDF, then slice from "Exercises" to the next "C HAPTER".

## Conventions

- Keep data in JSON and logic in code. Pay and timing constants live in `data/config.json`.
- Chats are saved as `chats/<id>.json`. The profile is `profile.json`; `main.js` `migrate()` fills in missing keys for older saves.
- After changes, run `npm run validate` and `node tests/ui-test.mjs` (Playwright is in `/opt/node22/lib/node_modules` in the cloud container).
- Release: bump `version` in `package.json` and push. The workflow builds on windows-latest and creates the Release `vX.Y.Z`.
