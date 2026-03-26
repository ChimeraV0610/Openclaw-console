# Phase 1 Console Handoff Runbook

_Last updated: 2026-03-26 00:16 America/New_York_

This runbook turns the Phase 1 coordination brief into concrete handoffs.

## Primary objective
Ship a Phase 1 console upgrade on top of the current dashboard in `workspace-gpt` with four core pages:
- Home
- Agents
- Tasks
- Trading

## Canonical source of truth
- `public/index.html`
- `public/app.js`
- `server.js`
- `data/tasks.json`
- `PHASE1_COORDINATION.md`

## Delivery order
### 1) Software PM
Output:
- page-by-page scope
- non-goals
- acceptance criteria
- phase 2 boundary list

Definition of done:
- each of Home / Agents / Tasks / Trading has a clear “must ship in phase 1” list
- deferred pages are explicitly listed
- no greenfield rewrite assumptions remain

Handoff to:
- Designer
- Backend Engineer
- Frontend Engineer
- Orchestrator

## 2) Designer
Input:
- Software PM scope

Output:
- panel hierarchy per page
- visual priority rules for urgency / next action / ownership / risk
- density guidance for trading workflow

Definition of done:
- each page has a top-to-bottom information order
- priority signals are explicit enough for implementation
- phase 2 design direction is noted but not overbuilt

Handoff to:
- Frontend Engineer
- Trading FE
- Orchestrator

## 3) Trading FE
Input:
- Software PM scope
- Designer hierarchy

Output:
- Trading page workflow skeleton
- low-click action path
- component ownership split between shell UI and trading-specific workflow

Definition of done:
- watchlist / execution queue / thesis / alerts / linked tasks flow is described
- fastest common actions are clear
- overlap with Frontend Engineer is minimized

Handoff to:
- Frontend Engineer
- Backend Engineer
- Orchestrator

## 4) Backend Engineer
Input:
- Software PM scope
- Trading FE workflow

Output:
- API/data contract additions for Home / Agents / Trading
- JSON store plan for activity / trading data where needed
- compatibility notes for existing overview/task routes

Definition of done:
- existing routes stay valid
- new routes or expanded payloads are defined
- frontend can build against a stable shape

Handoff to:
- Frontend Engineer
- Orchestrator

## 5) Frontend Engineer
Input:
- Software PM scope
- Designer hierarchy
- Trading FE workflow constraints
- Backend contract

Output:
- console shell
- left navigation
- page switching
- four page entry surfaces
- preserved task + automation controls

Definition of done:
- Home / Agents / Tasks / Trading can be navigated in one shell
- current functionality still works
- layout can absorb backend data additions without rewrite

Handoff to:
- Security
- Orchestrator

## 6) Security
Input:
- implementation diff
- deployment path assumptions

Output:
- deployment guardrails
- exposure review
- BASE_PATH and serving notes
- minimum auth/logging recommendations

Definition of done:
- canonical local path vs VPS path risk is documented
- major accidental exposure risks are called out
- phase 1 deployment checklist exists

Handoff to:
- Orchestrator

## 7) COO
Runs across all stages.

Responsibilities:
- keep sequence tight
- prevent duplicate work
- escalate blockers to orchestrator early
- enforce “scope first, build second”

## Blocker escalation rules
Escalate immediately if:
- someone tries to rebuild from scratch instead of extending current dashboard
- someone treats `workspace-dev` as canonical
- backend/frontend contracts diverge
- deployment work touches live VPS path without reviewed guardrails

## Orchestrator integration checklist
Before reporting phase progress upward, confirm:
- page priority still matches Home / Agents / Tasks / Trading
- current codebase remains canonical in `workspace-gpt`
- shell / design / backend assumptions do not conflict
- phase 2 pages are still deferred

## Minimal artifacts expected from each role
- Software PM: scope brief
- Designer: IA + hierarchy brief
- Trading FE: workflow brief
- Backend Engineer: API/data brief
- Frontend Engineer: implementation diff
- Security: guardrail brief
- COO: sequencing note / blocker register

## Success condition
The console phase should feel like one coordinated upgrade path, not parallel disconnected ideas.