# Phase 1 Trading Metrics & Operating Rules

_Last updated: 2026-03-26 00:55 America/New_York_

## Goal
Define the minimum trading/operations KPI layer for the Phase 1 console so Home and Trading can show decision-useful signals without pretending the platform already has full portfolio analytics.

## Product stance
Phase 1 metrics should answer:
- Are we moving work from research/watch to action fast enough?
- Are important items getting stuck?
- Are queue items actually being handled?
- Is the workflow disciplined enough to trust?

Phase 1 metrics should **not** try to fake:
- full PnL analytics
- broker-grade fill quality
- portfolio risk engine outputs
- advanced attribution or factor decomposition

## KPI design principles
1. **Workflow-first before market-first**
   In Phase 1, reliable workflow metrics matter more than noisy pseudo-trading performance.

2. **Surface only metrics that can be maintained honestly**
   If the system cannot compute a metric consistently, defer it.

3. **Prefer actionability over impressiveness**
   A blocked-queue count is more useful than a fake Sharpe ratio.

4. **Home gets compressed signals; deeper detail belongs later**
   Home should show 3-5 operational metrics, not a giant analytics wall.

## Phase 1 KPI set
### Tier A — must be visible in Phase 1
These are the most useful and realistic now.

#### 1) Watchlist count
Meaning:
- how many names/contracts are being actively monitored

Why it matters:
- shows surface area and current opportunity load

Primary surface:
- Trading page summary band
- optional compact stat on Home

#### 2) Execution queue count
Meaning:
- how many items have moved from monitoring into near-term action

Why it matters:
- shows whether the desk has actionable work, not just ideas

Primary surface:
- Trading page summary band
- Home compact trading snapshot

#### 3) Open alert count
Meaning:
- how many catalysts/risk flags currently require attention

Why it matters:
- urgency proxy
- helps prioritize desk attention quickly

Primary surface:
- Trading page summary band
- Home compact trading snapshot

#### 4) Linked task coverage
Meaning:
- percentage or count of queue/watch items that have linked tasks

Why it matters:
- measures whether research/execution work is actually owned
- prevents orphaned theses and “good idea, no operator” drift

Primary surface:
- Trading page summary band
- Home next-action snapshot if weak

#### 5) Blocked trading work count
Meaning:
- number of trading-relevant tasks/items in blocked state

Why it matters:
- strongest early warning for workflow breakdown

Primary surface:
- Home Now/Next panel
- Tasks page blocked section
- Trading alerts/support area

#### 6) Time since last meaningful update
Meaning:
- recency of activity across watchlist / queue / linked tasks

Why it matters:
- stale setups are dangerous
- reveals dead dashboards and abandoned queue items

Primary surface:
- Trading queue rows
- Agents / Home freshness signal

### Tier B — should be supported if data is easy
These are useful, but should not block Phase 1.

#### 7) Queue conversion rate
Definition:
- share of watchlist items promoted into execution queue over a rolling period

Use:
- indicates whether research/watchlist output is producing actionable ideas

Caution:
- low is not always bad; only meaningful with enough volume

#### 8) Queue resolution rate
Definition:
- share of queue items that end as ready/closed/blocked within a time window

Use:
- highlights whether queue is being processed or just accumulating

#### 9) Blocked duration
Definition:
- average/median age of blocked items

Use:
- identifies operational drag and neglect

#### 10) Task ownership coverage
Definition:
- percent of priority trading items with explicit owner

Use:
- enforces accountability in the console

## Defer to Phase 2
Do not force these into Phase 1 unless real infrastructure appears.

### Market performance metrics to defer
- realized PnL
- hit rate by setup outcome
- average win / average loss
- risk-reward realized ratio
- slippage / execution quality
- exposure by asset / sector / theme
- expectancy
- Sharpe / Sortino / factor-style metrics

### Research quality metrics to defer
- source quality scoring
- thesis accuracy over long windows
- catalyst prediction success rates
- analyst/agent scorecards with confidence calibration

### Operational analytics to defer
- full funnel conversion from idea → thesis → queue → execution → review
- team-level throughput dashboards
- cohort views by agent/desk/strategy
- long-horizon review quality scoring

## Home page metric priority
Home should show only the most actionable compressed signals.

### Recommended Home trading block
1. execution queue count
2. open alert count
3. blocked trading work count
4. linked task coverage or missing-link warning
5. top thesis / top setup placeholder if available

Reason:
Home is for triage, not analysis.

## Trading page metric priority
Trading can carry more context than Home, but still needs restraint.

### Recommended Trading summary band
1. watchlist count
2. execution queue count
3. risk/alert count
4. linked task coverage count

### Recommended row-level signals
For each queue item or watch item, prefer:
- status
- owner
- updatedAt / recency
- next action
- linked task presence

Not recommended for Phase 1 rows:
- fake precision performance numbers
- unsupported market stats that are mostly null

## Research → execution conversion rules
Phase 1 needs a simple disciplined funnel.

### State model
Use this conceptual progression:
1. **Watch** — monitor only
2. **Active thesis** — deserves attention, thesis exists
3. **Queued** — near-term action candidate
4. **Ready** — all required context exists, operator can act
5. **Blocked** — missing data/owner/catalyst clarity/risk clarity
6. **Closed** — no longer actionable or completed

### Promotion rules
#### Watch → Active thesis
Promote when:
- there is a clear catalyst, thesis, or reason-now
- item is more than generic market noise

#### Active thesis → Queued
Promote when:
- next action is specific
- owner is clear or assignable
- there is enough context to justify near-term attention

#### Queued → Ready
Promote when:
- trigger/condition is known
- risk or invalidation is visible
- linked task or operational follow-through exists if needed

### Block rules
Mark blocked when any of these is true:
- no owner
- no next action
- no trigger / catalyst clarity
- no risk note for a supposedly actionable item
- linked task is required but missing
- item is stale and no one has refreshed it

### Close rules
Close when:
- catalyst passed
- thesis invalidated
- action completed
- item no longer deserves desk attention

## Console operating rules
### Rule 1: no orphan queue items
Anything in execution queue should have:
- an owner
- a next action
- a recent timestamp

### Rule 2: no “strong conviction” without discipline fields
If an item looks important, it should also show:
- why now
- next action
- risk/invalidation

### Rule 3: blocked work must surface higher than passive watchlist noise
A blocked action item is more urgent than a low-conviction watch item.

### Rule 4: freshness matters
Older untouched queue items should visually decay in trust.

### Rule 5: Home should escalate missing ownership and blocked flow
If linked task coverage is weak or blocked count rises, Home should reflect that before decorative metrics.

## Suggested minimal formulas
These can be approximate JSON-derived formulas in Phase 1.

- **watchlistCount** = number of watchlist items
- **queueCount** = number of executionQueue items not closed
- **openAlertCount** = number of alerts with status != closed
- **linkedTaskCoverageCount** = number of trading items with at least one linked task
- **blockedTradingCount** = number of trading items/tasks with status = blocked
- **freshnessAge** = now - latest updatedAt among major trading objects

Optional later:
- **queueConversionRate** = promotedToQueue / totalWatchlistTouched
- **queueResolutionRate** = resolvedQueueItems / totalQueueItems

## Recommended data ownership
- Backend Engineer: exposes computed counts / raw stores
- Trading FE: defines where each metric appears in workflow
- Frontend Engineer: renders compact and detailed metric surfaces
- Trading PM: maintains KPI priority and rule clarity

## Acceptance mapping
This document satisfies Trading PM acceptance when:
- Phase 1-displayable KPI are listed
- now-vs-later metric boundary is explicit
- research-to-execution conversion rules are defined
- console operating rules are actionable for Home and Trading

## Immediate implication for current Phase 1 build
The current console can already support first-pass metrics using:
- `data/trading.json`
- trading-linked task detection
- task blocked/in-progress state
- updatedAt freshness

So Phase 1 should ship honest workflow KPI first, and leave market-performance analytics to Phase 2.
