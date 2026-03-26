# Phase 1 Handoff Cadence

_Last updated: 2026-03-26 00:33 America/New_York_

## Purpose
Make Phase 1 delivery operational across:
- Software PM
- Designer
- Frontend Engineer
- Backend Engineer
- Trading FE
- Trading PM
- Security
- Orchestrator

This cadence assumes the canonical mainline is `C:\Users\kylez\.openclaw\workspace-gpt` and the Phase 1 pages remain:
- Home
- Agents
- Tasks
- Trading

## Operating rules
- Scope first, build second.
- One canonical source only: `workspace-gpt`.
- No greenfield rewrite.
- Handoffs must include: output artifact, open questions, blockers, next owner.
- Escalate blockers early; do not wait for a full stop.

## Working sequence

### 0) Orchestrator kickoff
Orchestrator confirms:
- canonical path
- active Phase 1 priorities
- current task status
- latest accepted artifacts

Orchestrator hands off to:
- Software PM
- COO oversight

---

### 1) Software PM -> scope lock
Produces:
- `PHASE1_SCOPE.md`
- must-ship vs non-goals
- acceptance criteria per page
- explicit phase-2 boundary

Hands off to:
- Designer
- Backend Engineer
- Frontend Engineer
- Trading FE
- Trading PM
- Orchestrator

Gate to proceed:
- page boundaries are stable
- no role is designing against out-of-scope work

Blockers to escalate:
- page list changes
- unclear acceptance criteria
- pressure to add Research / Operations / System / Files into phase 1

---

### 2) Designer -> information priority lock
Input:
- Software PM scope

Produces:
- panel hierarchy
- visual priority rules
- ownership / urgency / next-action emphasis
- page-by-page layout guidance

Hands off to:
- Frontend Engineer
- Trading FE
- Orchestrator

Gate to proceed:
- FE can build without guessing layout priority
- Trading FE can refine Trading without redefining shell IA

Blockers to escalate:
- conflicting page priorities
- design that implies backend features not in scope
- unresolved shell vs trading-surface ownership

---

### 3) Trading FE -> trading workflow lock
Input:
- Software PM scope
- Designer hierarchy

Produces:
- trading workflow skeleton
- low-click action path
- component boundary for Trading-specific UI
- required data fields for watchlist / queue / alerts / thesis / linked tasks

Hands off to:
- Backend Engineer
- Frontend Engineer
- Trading PM
- Orchestrator

Gate to proceed:
- trading page workflow is specific enough to wire
- FE/BE boundary is clear

Blockers to escalate:
- missing trading item schema
- unclear linked-task behavior
- workflow requiring broker/execution features outside Phase 1

---

### 4) Trading PM -> metrics and ops overlay
Input:
- Software PM scope
- Trading FE workflow

Produces:
- phase-1 KPI shortlist
- what belongs on Home now vs deferred
- research-to-execution conversion rules
- minimum operating definitions for alerts, queue, and review states

Hands off to:
- Frontend Engineer
- Backend Engineer
- Orchestrator

Gate to proceed:
- Home and Trading metrics do not drift into phase-2 analytics
- naming/status rules are consistent

Blockers to escalate:
- KPI requests requiring unavailable data collection
- mismatch between product wording and trading workflow states

---

### 5) Backend Engineer -> contract lock
Input:
- Software PM scope
- Trading FE workflow
- Trading PM operating definitions

Produces:
- route/payload plan for Home / Agents / Trading
- JSON store shape for activity and trading data
- compatibility notes for existing task/overview APIs

Hands off to:
- Frontend Engineer
- Security
- Orchestrator

Gate to proceed:
- FE has stable response shapes
- existing task + automation behavior remains intact

Blockers to escalate:
- frontend depends on fields backend cannot support cleanly
- route shape conflicts with existing APIs
- contract churn after FE implementation starts

---

### 6) Frontend Engineer -> integrated shell build
Input:
- Software PM scope
- Designer hierarchy
- Trading FE workflow boundary
- Trading PM labels/metrics guidance
- Backend contract

Produces:
- left nav shell
- Home / Agents / Tasks / Trading entry surfaces
- preserved task and automation functionality
- trading page first-pass integration

Hands off to:
- Security
- Orchestrator

Gate to proceed:
- four pages render inside one shell
- task board still works
- no major mismatch between UI and contracts

Blockers to escalate:
- missing backend data needed for critical panels
- design ambiguity causing rework
- shell regressions to existing dashboard functions

---

### 7) Security -> deploy guardrail review
Input:
- implementation diff
- backend routes/data paths
- deploy assumptions

Produces:
- path boundary review
- BASE_PATH/serving guardrails
- minimum auth/logging/exposure notes
- phase-1 deploy checklist

Hands off to:
- Orchestrator

Gate to proceed:
- canonical local path vs live served path is explicit
- no obvious accidental exposure path is ignored

Blockers to escalate:
- live VPS path touched without review
- unsafe serving assumptions
- sensitive debugging/logging exposure

---

### 8) Orchestrator -> integration + report-out
Orchestrator confirms:
- canonical workspace stayed intact
- accepted artifacts are internally consistent
- unresolved blockers are named, not buried
- phase-2 work did not leak into phase 1

Orchestrator reports:
- shipped pieces
- open blockers
- next owner and next milestone

## Daily cadence
Use this lightweight rhythm during active build:

### A. Start-of-cycle sync
Owner posts:
- what artifact they are producing
- dependency they need
- blocker status
- ETA for handoff

### B. Handoff packet
Every handoff must include:
- artifact/file produced
- decisions locked
- assumptions made
- blocker list
- exact next owner

### C. Mid-cycle escalation
Escalate to Orchestrator immediately if blocker is:
- scope blocker
- contract blocker
- canonical-path blocker
- deployment/safety blocker

Do not wait for end-of-day.

### D. End-of-cycle state
COO/Orchestrator should be able to answer in one pass:
- What is done?
- What is blocked?
- Who owns the next move?
- What can ship now anyway?

## Blocker matrix

| Blocker type | First owner | Escalate to | Decision needed |
|---|---|---|---|
| Scope ambiguity | Software PM | Orchestrator | lock or cut scope |
| IA/layout conflict | Designer | Orchestrator | choose hierarchy |
| Trading workflow ambiguity | Trading FE + Trading PM | Orchestrator | simplify workflow |
| API/schema mismatch | Backend Engineer + Frontend Engineer | Orchestrator | freeze contract |
| Existing dashboard regression | Frontend Engineer | Orchestrator | rollback/patch priority |
| Deploy/path/security risk | Security | Orchestrator | block release or add guardrail |

## Anti-duplication rules
- Software PM owns scope words, not visual layout.
- Designer owns hierarchy/priority, not API shape.
- Trading FE owns Trading interaction flow, not shell navigation.
- Trading PM owns KPI/operating definitions, not page IA.
- Backend Engineer owns data contracts, not UI semantics.
- Frontend Engineer owns integration of approved UI + contracts, not product re-scoping.
- Security reviews deployment boundary, not product scope.
- Orchestrator resolves cross-role conflicts.

## Minimum ship-ready checklist
Before calling Phase 1 handoff healthy, confirm:
- `PHASE1_SCOPE.md` is the scope baseline
- design hierarchy exists for all four pages
- trading workflow is explicitly defined
- metrics/status language is coherent
- backend contracts are stable
- frontend shell is integrated
- security guardrails are documented
- open blockers are named with owner and next step

## Current status implication
Already complete:
- Software PM -> `PHASE1_SCOPE.md`
- Designer -> page hierarchy brief delivered
- Backend Engineer -> server/data contract foundation shipped
- Frontend Engineer -> shell + four-page entry shipped
- Trading FE -> `PHASE1_TRADING_WORKFLOW.md`
- Trading PM -> `PHASE1_TRADING_METRICS.md`
- Security -> `PHASE1_SECURITY_GUARDRAILS.md`

Current COO reading:
- the handoff chain is now defined and largely executed in the intended order
- duplication risk has been reduced by explicit role boundaries and canonical-path rules
- remaining risk is not missing process, but keeping future edits aligned to the same artifact set

COO next-step rule from here:
1. any new Phase 1 edit must reference the existing artifact stack first
2. if a change reopens scope, contract, or deployment assumptions, escalate back to Orchestrator immediately
3. do not start Phase 2 pages until the current Phase 1 artifact set is accepted as the baseline

## Accepted artifact stack
The current COO-approved artifact stack is:
- `PHASE1_COORDINATION.md`
- `PHASE1_HANDOFF_RUNBOOK.md`
- `PHASE1_HANDOFF_CADENCE.md`
- `PHASE1_SCOPE.md`
- `PHASE1_TRADING_WORKFLOW.md`
- `PHASE1_TRADING_METRICS.md`
- `PHASE1_SECURITY_GUARDRAILS.md`

## COO completion note
This task is complete once the team can answer, without ambiguity:
- who goes first
- who hands off to whom
- what triggers escalation
- which artifact currently governs the work

That condition is now satisfied for Phase 1.
