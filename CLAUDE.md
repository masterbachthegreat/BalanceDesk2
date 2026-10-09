# BalanceDesk: notes for working on this repo

Electron desktop game (Windows target). A Telegram-like UI where the player answers customers' finance, accounting,
stats and maths questions; OpenRouter LLMs play the customers (Haiku), grade answers and act as mentor (Sonnet).

## Layout

- `electron/main.js`: window plus the IPC handler `bd` that whitelists backend calls. Tray icon, close-to-tray, native notifications (`notify`), start with Windows (`--hidden`), `backgroundThrottling: false` so the world keeps running while hidden.
  - `preload.js` exposes `window.api`.
  - `backend.js`: JSON saves in `userData/save`, settings (API key encrypted via `safeStorage`), the OpenRouter client, and the usage log.
  - `mock-llm.js`: a fake LLM, used when `BD_MOCK_LLM=1`.
- `src/` is the renderer: plain ES modules, no bundler.
  - `js/core/`: `expr.js` (safe evaluator plus financial functions), `state.js` (global `S`, debounced saves), `bus.js`, `format.js`, `api-web.js` (browser shim for the dev server).
  - `js/game/`:
    - `world.js`: wall-clock world (Telegram-like). Arrivals are a non-homogeneous Poisson process weighted by who's awake; `catchUp()` replays the time the app was closed on launch; rush shifts, lighter/heavier days, time off (timers are shifted by its length). State in `profile.world`.
    - `presence.js`: persona timezone (`tz`) and `schedule` → awake/busy, phone-check Poisson process (`nextCheck`), log-normal online session lengths (`config.world.session`). Customers also pop online while waiting (`customers.ambientPresence`, `backfillPresence` after catch-up).
    - `customers.js`: per-chat event timeline in `cs` (`readAt`, `nudgeAt`, `leaveAt`, all wall time), shared by live play and catch-up; typing, Haiku prompt. Rush chats (`cs.mode === 'live'`) work in minutes. After a read, `thinkMs()` (config `customer.think`) delays typing by 10 s–2.5 min; while thinking live, new player messages are read and the LLM call restarts. While the app is open pending reads run `world.onlineSpeedup`× faster. A hidden anger value (`cs.anger`, tuned by `config.customer.meter`) sets the customer's tone and VIP grace. The user doesn't want a visible meter.
    - `boss.js`: manager Diane (chat id `boss`, model from settings `bossModel`, LLM role/category `boss`). Fully remote team (she must never suggest meeting in person).
      - Presence: her own online timeline (`profile.boss.pres`); on shift (`config.boss.shift`, player's local time) she's online most of the time and replies fast, off shift she checks her phone (`presence.offChecksPerHour`).
      - Memory: the whole chat is sent every time (her own actions folded in as `[done]` lines); the system prompt is static and the end of the history carries `cache_control` so OpenRouter/Anthropic can cache it. The live situation and allowed actions go in the final user turn (`contextNote`).
      - The LLM returns `{reply, action, warmth}` and may only pick actions the code lists as allowed (rush, lighter_day, heavier_day, time_off, end_time_off, transfer, raise).
      - Two hidden scores in `profile.boss`: `work` (chat results, missed customers, backlog) and `friendship` (only the `warmth` of the player's messages). Independent on purpose: the user wants a bad employee to be able to be her best friend.
      - `/urgent` (bot) → `boss.urgent()`: once per game (`profile.boss.urgentAt`), she comes online and reacts.
      - Rare "brb": `maybeStepAway` after a live reply; shared rate limit with customers (`customers.brbAllowed`, `config.world.brbEveryHours`). Customers: `customer.stepAway`, `cs.away`, acknowledged via `awayNote` in the prompt.
      - Unprompted messages (`proactive`): events from `noteEvent()` (results/progress), the >12 h backlog, and check-ins whose frequency and kind depend on friendship.
    - `team.js`: `#support-team` group chat (`data/team.json` coworkers + Diane). Every 12 h the customer model writes the next 12 h of chatter from code-decided facts (warnings about difficult customers, thanks when a coworker gets a customer the player flagged, transfers, promotions), queued in `profile.team.queue` and posted at their times. Player messages get replies from coworkers on shift (settings `teamModel`, LLM role `team`); Diane answers there via `boss.teamReply` (same memory as her DM; her DM prompt includes the channel). Warned personas get a higher arrival weight (`personaWeight`).
    - `questions.js` second chances: `noteResult` queues questions scored < 60 or never answered (`profile.retry`); `pickQuestion` serves a due one from a different persona. Returning customers: `customers.returningCustomer` (config `returning`).
    - Questions can carry an `attachment` table (`scripts/question-sources/attachments.py` swaps in text + table; cells take placeholders), posted as a `kind: 'file'` message and included in prompts via `transcript.questionText`.
    - `mentor.maybeDigest`: Sunday digest. `boss.maybeReview`: monthly review (outcome decided in code, KPI card `kind: 'review'`).
    - `concept.js`: the 📖 Concept lesson (Sonnet, cached per chat)
    - `results.js`, `grading.js` (Sonnet prompt), `payout.js`: ending a chat
    - `bot.js`: slash commands, `/payout`
    - `mentor.js`: Sonnet, `@chatN` transcripts, chart blocks, unprompted hints after repeated pushbacks (`maybeMentorHint`), Review with mentor
    - `manager.js`, `progress.js`: ranks and promotion
    - `shop.js`, `questions.js` (pick by book order), `template.js` (randomised questions), `clock.js` (wall clock; `activeMs` counts app-open time; `skip()` for tests)
  - `js/ui/`: sidebar (folder rail, search, mute, drafts, drag-reorder pins), chatview (incremental rendering with per-message signatures; reply/quote, reactions, edit/delete, pinned bar, unread divider, jump button, formatting, saved replies, scheduled send, chart viewer), modals, contextmenu (`showMenu` generic), drawer, floating (calculator, notepad), charts (Chart.js, vendored in `src/vendor`), markdown, photos (player's `avatars/` folder: files named after a character are theirs, others are a shared pool; `profile.photoMap`).
  - Message fields: `replyTo`, `reactions [{e, by}]`, `edited`/`editedAfterRead`, `scheduled`; chat fields: `pinnedMsg`, `draft`, `mutedUntil` (-1 = forever), `pinOrder`, `scheduled [{id,text,at,replyTo}]` (`game/scheduled.js`, delivered in `world.tick`/`catchUp`).
  - `game/names.js`: casual display names/@usernames for ordinary "First Last" personas (`chats.customerNames`); the AI always sees the full name.
  - Game modules reach UI only through `ui/registry.js`, which avoids import cycles.
- `data/`: every tunable is JSON. See README for the table.
- `scripts/`:
  - `dev-server.js`: serves the renderer in a browser with the same backend.
  - `validate-data.mjs`: checks data, runs every template against the book's numbers, and samples 200 variants of each.
  - `build-personalities.py`: regenerates `data/personalities.json`.
  - `question-sources/`: Python sources that generate `data/questions/*.json`.
- `tests/ui-test.mjs`: Playwright end-to-end test against the dev server with the mock LLM (100 checks; uses `__bd.clock.skip` and `__bd.world.catchUp` to simulate time away).

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
- Chats are saved as `chats/<id>.json`. The profile is `profile.json`; `main.js` `migrate()` fills in missing keys for older saves (profile `version` 2 = wall-clock timers; v1 chats are converted by `customers.migrateChat`).
- Message `t` is wall time and may be in the past (catch-up); `addMessage` keeps messages sorted by `t`.
- ☰ → Reset game calls `backend.resetSave()`: copies the save to `save-backups/<time>/` beside it, deletes chats and profile (keeps settings; usage log optional). `S.resetting` blocks saves until the reload.
- After changes, run `npm run validate` and `node tests/ui-test.mjs` (Playwright is in `/opt/node22/lib/node_modules` in the cloud container).
- Release: bump `version` in `package.json` and push. The workflow builds on windows-latest and creates the Release `vX.Y.Z`.
