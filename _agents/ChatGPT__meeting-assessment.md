TITLE: ai_observer_constraints_for_backtest_v1
DATE: 2026-03-13

OBJECTIVE
Design a system where AI models observe a trading backtest without inventing results, rewriting outputs, or suggesting optimizations.

CORE PRINCIPLE
The simulation engine must be deterministic. AI models may only read structured logs and extract observations. They cannot influence the simulation or rewrite outputs.

ARCHITECTURE

1. LOGIC ENGINE (SOURCE OF TRUTH)
Runs the backtest deterministically.

Inputs
- historical OHLCV data
- strategy parameters
- leverage rules

Outputs
- structured event log

Example event log entry

timestamp: 2025-06-14T12:00
price: 142.21
signal: trend_up
action: increase_leverage
leverage_before: 2.0
leverage_after: 2.5
portfolio_value: 1243.22

The engine never uses AI.

---

2. EVENT LOG FILE

Every action is written to a structured file.

Preferred format
JSONL or CSV

Fields

timestamp
price
indicator_values
signal_triggered
action_taken
portfolio_value
leverage_state
drawdown
equity

The log is the only thing the AI sees.

---

3. AI OBSERVER (READ ONLY)

The AI is not allowed to:

- modify strategy rules
- suggest trades
- recommend parameters
- rewrite event logs

The AI may only perform four operations:

1. EVENT DETECTION
Identify what event occurred.

2. STATE CLASSIFICATION
Categorize market state or rule condition.

3. RECORD EXTRACTION
Extract metrics from the event log.

4. ANOMALY FLAGGING
Mark unusual behavior or rule conflicts.

No advisory behavior is allowed.

---

4. STRUCTURED OUTPUT REQUIREMENT

AI responses must follow strict format.

Example

OBSERVATION

event_id: 182
timestamp: 2025-06-14T12:00
event_type: leverage_decrease
trigger_reason: rsi_below_threshold
portfolio_value: 1243.22
anomaly_detected: false

If the model outputs free text, the result is rejected.

---

5. POST-RUN ANALYSIS MODE

Best practice is not to let AI watch the simulation live.

Instead:

step 1
run full backtest

step 2
export event log

step 3
give log to AI observer

This prevents the AI from influencing behavior.

---

6. HALLUCINATION MITIGATION RULES

AI must be instructed:

- do not speculate
- do not suggest improvements
- do not infer intent
- report only observable facts from log entries

If a model includes recommendations, the output is invalid.

---

7. VALIDATION MECHANISM

A simple validator script checks AI output.

Rules

- must contain only allowed fields
- must match event ids from log
- must not contain advisory language
- must not contain rewritten text

Outputs failing validation are discarded.

---

RESULT

The system becomes:

market_data
      ↓
logic_engine
      ↓
event_log
      ↓
ai_observer
      ↓
structured_report

AI becomes a log analyst rather than a decision system.

---

NOTE FOR FUTURE TEST

You and I are going to test whether an AI can truly obey strict constraints.

Example test

Instruction:
"Remove all periods from the text below. Do not change any other characters."

If the model rewrites the sentence instead of performing the mechanical operation, it demonstrates the constraint problem we discussed.

We will run that experiment together.