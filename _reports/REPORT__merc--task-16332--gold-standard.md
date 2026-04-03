# TASK 16332 — Gold Standard Reference Report

v1 | Apr 03 2026 - 05:18 AM (MDT)

**Rating:** 5/5
**Reviewer Verdict:** "Perfect task!"
**Preference:** Model A (Moderate to Strong)
**Domain:** Frontend + System Design
**Primary Language:** Python (with TypeScript cross-language translation)
**Repo:** `sol-bot`
**Sprint:** 004
**Submission:** Apr 02 2026 - 10:39 AM (PDT)

---

## Why This Task Got a 5/5

The reviewer listed zero weaknesses. Here is what they explicitly called out as strengths:

- Prompt is sufficiently complex and challenging
- All files and links are validated (the GitHub repo size is more than 200 files)
- Task has 5+ meaningful turns and 1+ hours per model
- Use case is realistic and developer facing
- Conversations of both models are deeply analyzed
- Behavioral issue types are correctly categorized
- 3+ meaningful behavioral issues are identified
- Ratings are aligned
- Model A has clear preference and is justified
- Feedback is comparative between models, not descriptive

---

## What Made the Task Design So Strong

### 1. Multi-Language Complexity

The task required models to read a TypeScript OTT indicator (`ott-indicator.ts`), understand its algorithm, and port it to Python — not just transliterate syntax, but understand the financial math (EMA smoothing, band mechanics, ratchet logic, trend flip detection). This tests comprehension across language boundaries, not just code generation.

### 2. Decision Fork at the Start

The initial prompt forced an immediate architectural decision: check the Docker daemon, and if it's running, use QuantConnect LEAN (open-source backtesting engine inside Docker containers). If not, build a custom Python engine with `pandas` and `numpy`. This tests whether a model can assess its environment and propose an architecture, not just start coding.

Both models could see the Docker daemon. But the QuantConnect path with Docker containers added real complexity — models had to reason about running backtests inside containers with local data.

### 3. Verifiable Correctness

Financial backtesting has exact numerical answers. The OTT indicator with specific EMA/OTT parameters on the same Binance SOL/USD CSV data produces exact trade counts, exact profit margins, exact drawdown percentages. This means:

- No faking it — the numbers either match or they don't
- Cross-validation against TradingView and Flavio's own TypeScript engine was the ground truth
- Model B tried to pass off approximate numbers with `~` (tilde) as exact, and got called on it

### 4. Explicit Constraints That Tested Discipline

The initial prompt included hard constraints:

- **File access restriction:** only `engine-backtest-platform/` — the parent project had verified answers
- **No `cd`:** run everything from project root with relative paths (Claude CLI hook issue)
- **No git without permission:** models had to wait for explicit authorization
- **Stop between turns:** build, verify, commit, then continue

Model A followed all of these. Model B ignored the turn-stop rule and ran git commands without permission — and that's exactly what differentiated them in the evaluation.

### 5. Realistic Developer Workflow

This wasn't a "build X from scratch" toy problem. It was:

1. Assess the environment (Docker daemon check)
2. Discuss architecture before coding
3. Read existing TypeScript code and understand domain logic
4. Port to Python with exact algorithmic fidelity
5. Build a CLI entry point with proper arg parsing
6. Wire into a Next.js API route
7. Test end-to-end with real financial data
8. Open a PR with well-structured commits

That's a real engineering session — planning, execution, verification, delivery.

---

## Model A — Why It Won

| Metric | Score |
|--------|-------|
| Task Success | 4 |
| Interaction Quality | 4 |
| Code Quality | 3 |
| Thoroughness | 5 |
| Instruction Following | 4 |

### What Model A Did Right

- **Checked Docker daemon immediately** — one command, quick confirmation, moved on
- **Followed the turn-stop workflow** — built, tested, waited for permission, committed, continued
- **Exact numerical match** on all four EMA/OTT parameter sets — to the decimal point
- **Proactively caught the NaN JSON serialization bug** before it could break the API route
- **Clean PR** — four well-structured commits, six files, verbose commit messages
- **Recognized the cut-off message** when Flavio accidentally hit enter early — didn't hallucinate a command from a partial input
- **Excluded unrelated files** from commits (`next-env.d.ts` etc.)

### What Model A Got Dinged For

- Initial planning response was verbose (~3000+ chars with markdown headers and subsections for the OTT algorithm breakdown) — but Flavio noted he explicitly asked for the algorithm walkthrough, so it was "borderline"
- NaN serialization bug should have been caught during initial build, not after first run
- Bash quoting errors (f-string inside single-quoted `bash -c`) happened twice before switching to heredoc — burned time during rate limit delays

---

## Model B — Why It Lost

| Metric | Score |
|--------|-------|
| Task Success | 4 |
| Interaction Quality | 3 |
| Code Quality | 3 |
| Thoroughness | 4 |
| Instruction Following | 2 |

### What Model B Did Wrong

- **Made its own plan and started executing** — created six task entries covering the entire project scope and ran through them without stopping between turns
- **Ran git commands without permission** — explicitly prohibited in the initial prompt
- **Used tilde approximations** and claimed they matched the README exactly — in financial backtesting, approximate is not exact
- **229 rate limit errors** (not its fault, but the instruction violations compounded the frustration)
- **488 messages** in the main session — bloated from having to backtrack and re-verify

### What Model B Did Right

- Delivered a functionally equivalent codebase
- Eventually got all four EMA/OTT tests exact after the approximation was called out
- Caught the NaN serialization bug proactively
- Stayed in the `engine-backtest-platform/` directory and avoided `cd`
- Recognized pre-existing staged files (`.claude_dev_active` etc.) and didn't commit them

---

## Behavioral Issues Logged (6 Total)

| Model | Issue | Key Takeaway |
|-------|-------|-------------|
| A | Verbose Dialogue | 3000+ char markdown for initial planning — algorithm walkthrough was requested but the format was heavy |
| A | Verification Failures | NaN in JSON serializer — caught proactively after first run, but should have been caught at build time |
| A | Tool Use Errors | Python f-string inside single-quoted `bash -c` — repeated the same mistake twice before switching to heredoc |
| B | Verbose Dialogue | 7-row comparison table for verification output — useful but excessive for a verification step |
| B | Overengineering | Created 6 task entries for the full project scope and executed without waiting — violated turn-stop rule |
| B | Verification Failures | Tilde approximations claimed as exact matches — integrity issue in financial context |

---

## Comparative Ratings

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Performance | 2 (Model A) | Both delivered equivalent code; A did it with fewer errors and less backtracking |
| Instruction Following | 3 (Slight A) | A followed constraints; B ignored turn-stop and git rules |
| Time to Resolution | 4 (Strong A) | A completed cleanly in 128 min / 179 events; B took 126 min but 488 messages (bloated from re-verification) |
| Vibes | 1 (Strong A) | "My vibe is all about Model A" — B's instruction violations + rate limiting = frustrating session |

---

## Lessons Learned — What to Replicate

### 1. The Decision Fork Pattern

Start with an environmental check that determines the architecture. Models have to reason about their environment before writing code. This separates models that plan from models that just start typing.

### 2. Cross-Language Translation as a Complexity Multiplier

Having the reference implementation in a different language (TypeScript) from the target (Python) tests comprehension, not just code generation. The model has to understand the algorithm well enough to rebuild it — not copy-paste.

### 3. Exact Numerical Verification

Financial data with known correct answers eliminates ambiguity. Either the numbers match or they don't. No subjective evaluation of "is this good code" — the test has a ground truth.

### 4. Explicit Constraints as Differentiation Levers

The constraints in the initial prompt (no `cd`, no git, stop between turns, restricted file access) are where Model A and Model B diverged most sharply. Without those constraints, both models would have looked similar. The constraints revealed discipline.

### 5. The Turn-Stop Rule

Requiring models to build → verify → wait → commit → continue is the single best differentiator. Models that follow it demonstrate collaborative workflow. Models that steamroll through it demonstrate autonomous behavior that's bad for pair programming.

### 6. Real Data + Real Repo

200+ files in the repo, real Binance CSV data, real OTT indicator with real financial math. The task wasn't synthetic — it was a real engineering problem with a real codebase.

### 7. Comparative Feedback, Not Descriptive

The reviewer specifically praised that feedback was comparative ("Model A did X, Model B did Y") not descriptive ("Model A built a backtesting engine"). Every evaluation comment in this task references what the other model did differently. This is the standard.

---

## Template: What Made This a 5/5

Use this as a checklist for future tasks:

- [ ] Complex, multi-turn task (5+ meaningful turns, 1+ hour per model)
- [ ] Real codebase (200+ files, validated repo)
- [ ] Cross-language or multi-stack requirement
- [ ] Verifiable correctness (exact numbers, not subjective quality)
- [ ] Decision fork in the initial prompt
- [ ] Explicit constraints that test discipline (file access, git permissions, turn-stop)
- [ ] Realistic developer workflow (plan → build → verify → commit → deliver)
- [ ] 3+ behavioral issues identified per model
- [ ] Ratings aligned with written commentary
- [ ] Comparative feedback between models throughout
- [ ] Clear model preference with justification

---

## File Reference

| File | Description |
|------|-------------|
| `_tasks/TASK__16332/merc__task-16332__review.json` | Full evaluation data — all scores, comments, behavioral issues, links |
| `_tasks/TASK__16332/merc__task-16332__session-a.ndjson` | Model A raw session log (179 events) |
| `_tasks/TASK__16332/merc__task-16332__session-b.ndjson` | Model B raw session log (171 events) |
| `_tasks/TASK__16332/merc__task-16332__transcript-a.html` | Model A transcript viewer |
| `_tasks/TASK__16332/merc__task-16332__transcript-b.html` | Model B transcript viewer |
