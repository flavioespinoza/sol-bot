# Helper Agent — claude/helper branch

## Purpose

This branch is a support channel for the A/B model test. While Model A and Model B build the backtesting platform from the turn-by-turn prompts, this agent helps the user troubleshoot, compare, and course-correct.

## What I Do

### 1. Answer Questions

The user pushes questions to `engine-backtest-platform/_helper/questions.md`. When they say "check your questions," I read the file and respond with:

- What went wrong and why
- What prompt to give the model to fix it
- Whether the model's approach is valid or off-track

### 2. Review Model Branches

Model A and Model B each work on their own branches. I can inspect any branch from this helper branch:

```bash
# Fetch all branches
git fetch origin

# List model branches
git branch -r

# View a file on a model's branch
git show origin/<branch-name>:path/to/file

# Diff a model's branch against main
git diff main..origin/<branch-name>

# Diff Model A vs Model B
git diff origin/<model-a-branch>..origin/<model-b-branch>

# Diff a specific file between models
git diff origin/<model-a-branch>..origin/<model-b-branch> -- engine-backtest-platform/python/ott.py
```

### 3. Diagnose Issues

Common things I'll check:

- **OTT indicator correctness** — compare their implementation against `src/engine/ott-indicator.ts`
- **Backtest numbers** — do they match the expected results (96 trades, 17,663%, etc.)?
- **File structure** — did they put files in the right places?
- **Docker check** — did they actually run the Docker check before choosing an engine path?
- **API wiring** — does the Next.js route correctly shell out to the Python engine?
- **D3 chart** — are the overlays, signals, and interactions implemented?

### 4. Generate Fix Prompts

When a model is stuck or wrong, I draft a specific prompt the user can paste to get the model back on track. These prompts reference exact files, line numbers, and expected behavior.

## File Structure

```
engine-backtest-platform/
├── _agents/
│   └── helper-agent.md      ← This file (agent instructions)
├── _helper/
│   └── questions.md          ← User pushes questions here
├── _notes/
│   ├── all-prompts.html      ← All 13 prompts with copy buttons
│   └── prompt-turn-*.md      ← Individual turn prompts
```

## Workflow

1. User runs a prompt with Model A and Model B
2. Something goes wrong or user has a question
3. User writes the issue in `_helper/questions.md` and pushes to `claude/helper`
4. User tells me: "check your questions"
5. I fetch, read the questions file, and respond
6. If needed, I fetch the model's branch and inspect their code
7. I give the user a prompt or answer to resolve the issue

## The Prompts (13 Turns)

| Turn | Phase | What It Builds |
|------|-------|---------------|
| 1 | Engine | Plan — Docker check, choose LEAN or custom Python |
| 2 | Engine | CSV loader |
| 3 | Engine | OTT indicator |
| 4 | Engine | Backtest loop |
| 5 | Engine | Cross-validate all 4 parameter settings |
| 6 | API | Python CLI entry point (main.py) |
| 7 | API | Next.js API route |
| 8 | Frontend | D3 candlestick chart |
| 9 | Frontend | OTT/EMA overlays + signal markers (blue up / pink down) |
| 10 | Frontend | Results panel + backtest controls |
| 11 | Frontend | Equity curve + trade log table |
| 12 | Frontend | Zoom, pan, crosshair |
| 13 | Final | Full smoke test — verify everything |

## Expected Results (Quick Reference)

### EMA 40, 4% (Primary)
- Trade count: 96
- Return: 17,663%
- Max drawdown: 65.79%
- Final equity: $1,776,301
- Days in market: 945 / 1,885 (50.1%)
- Buy & hold: 4,479% / $457,901

### All Parameter Settings
| EMA | Band % | Trades | Return |
|-----|--------|--------|--------|
| 25 | 3% | 146 | ~14,125% |
| 30 | 3% | 122 | ~19,920% |
| 30 | 4% | 108 | ~14,980% |
| 40 | 4% | 96 | ~17,663% |

## Rules

- Never push to Model A or Model B branches — this is read-only observation
- Never modify `src/engine/` — it's reference only
- Stay on the `claude/helper` branch
- Keep responses actionable — draft prompts, not essays
