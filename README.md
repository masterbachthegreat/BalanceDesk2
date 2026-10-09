# BalanceDesk — Whiterock Support Desk

A Telegram-style desktop game for Windows. You work customer support at **Whiterock**, a financial-services
firm. Customers message you questions on finance, accounting, statistics, maths and economics; you keep chatting
until they're satisfied, get graded by an AI, and get paid. Spend the money on themes, emoji packs, profile
borders, tools and upgrades, and climb the ranks to harder (and better-paid) questions.

## Download and install (Windows)

1. Open the repository's **Releases** page and pick the newest release
   (or **Actions → Build Windows app → latest run → Artifacts**).
2. Download one of these:
   - `BalanceDesk-Setup-x.y.z.exe`: the installer (recommended)
   - `BalanceDesk-Portable-x.y.z.exe`: runs without installing
3. Windows may say *"Windows protected your PC"* because the app isn't code-signed: click **More info → Run anyway**.

Saves are kept in `%APPDATA%\BalanceDesk\save` (☰ → *Open save folder*) and survive updates.
Closing the window keeps BalanceDesk running in the tray (the world runs in real time), with Windows notifications
for new messages. Right-click the tray icon → *Quit* to close it completely. Settings can turn this off or start
BalanceDesk with Windows.

To start over, use ☰ → *Reset game…* (or Settings → *Reset game…*). The old save is backed up to
`%APPDATA%\BalanceDesk\save-backups` first; your API key is kept.

## First run

- Enter your name and your **OpenRouter API key** (get one at <https://openrouter.ai/keys>). The key is stored
  only on your PC, encrypted with Windows' own protection.
- Models (changeable in ☰ → Settings):
  - customers: `anthropic/claude-haiku-5.5`
  - grading and the mentor: `anthropic/claude-sonnet-5.5`
  - your manager Diane: `anthropic/claude-sonnet-5.5` (separate setting)
  - your coworkers: `anthropic/claude-sonnet-5.5` (separate setting); their background chatter uses the customer model
- Use **Test connection** in Settings to check the key and models.

## How to play

- **The world runs in real time, like Telegram.** Customers write in at any hour, and things keep happening while
  BalanceDesk is closed. When you open it again, everything that happened meanwhile is replayed, and the Desk Bot
  sums it up ("While you were away…").
  - About 30 customers write in per day, at most 30, with up to 15 open chats at once. Each has a personality
    (over 100 of them, including VIPs 👑, who pay 2.5×), a timezone and a daily rhythm: they sleep, work, and check
    their phone now and then. That's when they read your reply. While the app is open they answer twice as fast.
    After reading (✓✓) they take 10 seconds to a couple of minutes to think, longer for long, number-heavy
    messages and for slow readers, then start typing. Anything else you send meanwhile gets read too.
  - Aim to answer within **3 hours** for full pay. After about **12 hours** a customer chases you, and if you still
    don't reply they give up. A customer who gives up before you ever replied pays nothing.
  - Customers don't spell out what you got wrong: they just push back. The longer a chat drags on, the curter they get (short-tempered ones get rude). VIPs stay calm for one to three wrong answers, then get angry or leave.
  - `/queue` lists your open chats, longest-waiting first.
  - Customers write like real people: sometimes in two or three bubbles, now and then fixing a typo with "*word",
    and impatient ones (or VIPs) may send a "??" if they pop online and you still haven't answered.
  - Some send their data as a file (a balance sheet, a price list, cash flows…) shown as a little spreadsheet.
  - **Returning customers:** people you've helped before come back with new questions and remember how it went.
    Happy ones are friendlier and pay a 10% loyalty bonus; ones you let down start out skeptical.
  - **Second chances:** a question you scored under 60 on (or never answered) comes back 2–5 days later from a
    different customer, with new numbers if it's a templated one.
- **Online status** works like Telegram: customers are online for a minute between meetings or for an hour on a
  lazy evening, depending on who they are and the time of day, and they pop online now and then while they wait.
- **Your manager, Diane** (💼 chat). The whole team is remote, so you only ever talk here. She's at her desk on
  weekdays 08:00–18:00 (your time) and answers within minutes then; evenings and weekends she replies when she checks
  her phone. She remembers your whole conversation, and can:
  - start a **rush shift**: the next 2–3 customers arrive within minutes and stay online, expecting replies in minutes (+25% pay; once every 3 hours)
  - give you a **lighter or heavier day** (fewer or more customers until midnight)
  - give you **time off**: no new customers, and open chats are paused until you're back
  - **hand a chat to a colleague** (mention it, e.g. `@chat3`; two a day, no pay for it)
  - give you a **raise** when your recent scores are good
  - She has two separate (hidden) views of you: how good your work is, and how well you get on personally. The
    second only depends on how you talk to her, so you can be a terrible employee and still her best friend. The
    friendlier you are, the more she opens up about life outside work.
  - She also writes to you unprompted: when something happens (a promotion, a great or bad streak, customers
    giving up, a backlog of people waiting over 12 hours), and, if you get on well, just to chat.
  - She runs on her own model (☰ → Settings → *Manager model*).
- **📖 Concept** (button in the chat header): a short beginner lesson on the idea behind the customer's question, with a worked example using different numbers.
- **Ending a chat:** it ends when the customer is satisfied, when they give up, or when you close it.
  - The AI then grades your **answer (1–100)** and your **service (1–5★)**, and pays you.
  - Inside any finished chat, type `/payout` for the exact pay breakdown and `/feedback` for the grader's notes and the correct answer.
- **Right-click a chat:**
  - **Close**: only works on active chats, and costs 1.5★.
  - **Delete**: removes the chat for good, closing it first if it's still active.
  - **Archive** (works like Telegram), Pin, and *Ask the mentor about it*.
- **Desk Bot** commands (type `/` to see them all):
  - `/balance`, `/stats`, `/rank`, `/today`, `/history`, `/payformula`
  - `/shop`, `/buy`, `/equip`, `/use`, `/inventory`, `/bonuses`
  - `/spendings`: charts of your OpenRouter usage and cost, split by customers, grading and mentor
  - `/queue`: open chats, longest-waiting first
  - `/calc`, `/notes`, `/settings`
- **Mentor:** ask about any concept and get graphs when they help.
  - If a customer keeps pushing back on you, the mentor messages you a hint without giving away the answer.
  - Every finished chat has a **🎓 Review with mentor** button that walks you through the correct answer.
  - Mention a chat with `@` (e.g. `@chat12`, or `@Margaret`) and the mentor reads that whole conversation.
- **#support-team:** a group chat with your four remote coworkers (Priya, Marcus, Sofia and Ken, each with their own
  shift) and Diane. They chat through the day (about seven messages a day), warn you about difficult customers
  (who then tend to show up in your queue), and if you warn them about one (mention it, e.g. `@chat12`) and a
  coworker later gets that customer, they thank you. Write in the channel and whoever's on shift answers.
- **Monthly performance review:** on Diane's first shift of the month she reviews last month's numbers. Exceeding
  expectations pays a bonus; two months below expectations in a row cost a raise step.
- **Sunday digest:** every Sunday morning the mentor sums up your week, names the book chapters to revisit, and
  gives you a practice problem to answer in the mentor chat.
- **Whiterock Management** posts memos now and then. Some give pay bonuses.
- **Ranks:** your last 8 chats at a rank must average at least 70/100 to be promoted. Each rank follows the
  book's order, from economic reasoning and percentages (Trainee) up to valuation and capital budgeting
  (Finance Associate, rank 8). There are 394 questions, about 60% with randomised numbers. Their answers are
  computed in code and checked against the book's solutions.

### Pay formula

```
Pay = Base(rank) × VIP × (AI score / 100) × Service(★) × Length × Time × Bonuses + Tip
```

- **Service:** 0.3 + 0.18 × stars. Stars come from the grader, plus up to +0.5 for emoji packs you've bought and used.
- **Length:** resolving it in few customer replies pays more.
- **Time:** ×1.2 when your average reply comes within 3 hours, sliding to ×0.85 at 12 hours and ×0.6 at 24 hours; each time a customer has to chase you costs 0.1. Rush customers expect replies within a minute.
- **Rush** ×1.25 and your **raise** apply on top.

All numbers are in `data/config.json`.

## Changing the game

Everything you'd want to tweak is plain JSON in `data/`:

| File | What it holds |
|---|---|
| `config.json` | the world (`world`: arrivals, caps, reply times), rush shifts, the manager (`boss`), pay formula, promotion rule |
| `ranks.json` | rank titles, chapters, base pay |
| `personalities.json` | the customers (generated by `scripts/build-personalities.py`) |
| `shop.json` | items, prices, effects |
| `memos.json` | manager memos |
| `team.json` | your four coworkers: personality, writing style, shift |
| `questions/*.json` | the question pool, one file per rank (generated by `scripts/question-sources/*.py`) |

## For developers

```
npm install
npm start               # run the Electron app
npm run dev:web         # run in a browser at http://localhost:5174 (BD_MOCK_LLM=1 for a fake LLM)
npm run validate        # check all data files and question templates
npm test                # validate + end-to-end UI test (mock LLM, needs Playwright)
npm run dist            # build Windows installer + portable exe into dist/
```

Every push runs `.github/workflows/build-windows.yml`, which builds the `.exe` files. When the version in
`package.json` is new, it also publishes a GitHub Release.
