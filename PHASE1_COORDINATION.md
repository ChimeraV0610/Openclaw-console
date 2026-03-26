# Phase 1 Console Coordination

_Last updated: 2026-03-26 00:06 America/New_York_

## Goal
Deliver a Phase 1 console upgrade on top of the existing dashboard in `workspace-gpt`, without greenfield redesign.

## Canonical implementation path
- Main workspace: `C:\Users\kylez\.openclaw\workspace-gpt`
- Core files:
  - `public/index.html`
  - `public/app.js`
  - `server.js`
  - `data/tasks.json`

## Phase 1 page priority
1. **Home** — command center, overview, next actions, risk/health summary
2. **Agents** — agent state, ownership, recent activity, handoff visibility
3. **Tasks** — task board, blockers, priorities, routing, acceptance visibility
4. **Trading** — watchlist / execution queue / linked tasks / thesis / alerts shell

Deferred to Phase 2:
- Research
- Operations
- System
- Files

## Current product baseline
Existing product already has:
- a single-page dashboard shell in `public/index.html`
- client rendering in `public/app.js`
- Node server and JSON-backed task/automation APIs in `server.js`
- task board + automation heartbeat hooks

This means Phase 1 should be an extension of the current dashboard, not a rewrite.

## Workstream ownership
### Software PM
Must define:
- Home / Agents / Tasks / Trading scope
- non-goals for Phase 1
- acceptance criteria per page
- explicit Phase 2 boundary

### Frontend Engineer
Must implement:
- console shell
- left navigation
- page switching between Home / Agents / Tasks / Trading
- preserve existing task + automation functionality

### Backend Engineer
Must extend:
- `server.js`
- data contracts for Home / Agents / Trading
- initial activity/trading JSON stores if needed
- compatibility with `/api/overview` and existing task workflow

### Designer
Must provide:
- panel hierarchy for four core pages
- urgency / next action / ownership visual priority
- dashboard density guidance for trader workflow

### Trading FE
Must define:
- Trading page workflow skeleton
- low-friction key actions
- panel boundaries vs general Frontend Engineer shell work

### Trading PM
Must define:
- KPI set for Phase 1
- what metrics show on Home now vs later
- research-to-execution conversion rules

### Security
Must review:
- canonical local path vs VPS served path
- BASE_PATH and serving assumptions
- auth/logging/exposure guardrails for Phase 1 deploy

### COO
Must define:
- handoff order
- blocker escalation path
- review cadence to avoid duplicate work

## Recommended handoff order
1. **Software PM** locks page scope + acceptance criteria
2. **Designer** converts scope into panel hierarchy and information priority
3. **Trading FE** refines Trading workflow specifics inside that shell
4. **Backend Engineer** defines/ships data contracts and storage shape
5. **Frontend Engineer** implements shell + four page entry points using approved hierarchy/contracts
6. **Security** reviews deployment boundary before live sync
7. **COO** keeps sequencing and blocker escalation tight throughout

## Immediate implementation constraints
- Do **not** replace the current dashboard with a brand-new product concept
- Do **not** treat `workspace-dev` as the canonical console source
- Keep task board / automation controls functional during UI upgrade
- Trading page can be a strong Phase 1 shell, but not a full execution platform yet

## What success looks like for orchestration
- all contributors reference the same canonical files
- page priority is explicit and consistent
- shell/API/design work are sequenced instead of competing
- phase boundaries are visible so work does not sprawl
- final integrated summary can be reported back cleanly

## Current orchestrator call
Use this document as the coordination baseline for any Phase 1 console work until replaced by a newer integrated brief.
