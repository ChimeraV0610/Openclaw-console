# Phase 1 Scope — Home / Agents / Tasks / Trading

_Last updated: 2026-03-26 00:16 America/New_York_

## Product intent
Ship a Phase 1 console upgrade by extending the existing dashboard in `workspace-gpt`, not replacing it.

Current baseline already exists:
- single-page dashboard shell in `public/index.html`
- client rendering and polling in `public/app.js`
- Node + JSON API layer in `server.js`
- task + automation state in `data/tasks.json` and `data/automation.json`

Phase 1 should preserve the current strengths:
- OpenClaw agent status visibility
- task board CRUD and status updates
- automation toggle / tick controls
- overview polling from existing APIs

## Phase 1 navigation
Must ship as the primary left-nav pages:
1. Home
2. Agents
3. Tasks
4. Trading

Deferred to Phase 2:
- Research
- Operations
- System
- Files

## Cross-page product rules
- Do not introduce a greenfield information architecture unrelated to the current dashboard.
- Keep current `/api/overview`, `/api/tasks`, `/api/automation`, and task workflow usable during migration.
- Prefer one-shell multi-page navigation over separate standalone screens.
- Optimize for operator triage: what matters now, who owns it, what is blocked, what action is next.
- Trading in Phase 1 is a workflow shell and monitoring surface, not a full broker/execution terminal.

---

## 1) Home

### Purpose
Home is the command center. It should answer, in one screen: what needs attention now, which agents are active, what tasks are at risk, and what trading work is live.

### Must ship in Phase 1
- Top-level summary cards evolved from the current stats row:
  - primary agent
  - online/working agents
  - done vs pending tasks
  - automation state / last heartbeat
- "Now / Next" panel summarizing:
  - next runnable task
  - blocked task count
  - most urgent in-progress item
- compact agent health snapshot:
  - top active agents
  - working / online / offline state
- compact task priority snapshot:
  - top priority todo/in-progress/blocked tasks
- compact trading snapshot:
  - watchlist count
  - alerts count
  - execution queue count
  - highest-priority thesis or setup placeholder if data exists
- existing refresh and automation controls remain accessible from Home

### Explicit non-goals for Phase 1
- no deep research workspace on Home
- no full KPI/operations analytics suite
- no system admin console
- no file explorer/document browser

### Acceptance criteria
- Home loads from the existing dashboard shell and shows operational summary without needing to open another page.
- A user can identify the current primary agent, automation status, blocked task count, and next task from Home alone.
- Home links or routes cleanly into Agents, Tasks, and Trading for deeper inspection.
- Existing automation controls still work after Home is introduced.

---

## 2) Agents

### Purpose
Agents is the ownership and activity surface. It should make agent state, recent activity, and routing clarity much easier to scan than the current single list.

### Must ship in Phase 1
- agent roster using existing OpenClaw health/session data
- per-agent card or row with:
  - agent id/name
  - primary flag
  - working / online / offline state
  - workspace
  - heartbeat enabled / cadence
  - sessions count
  - recent model
  - recent activity age
- grouping or filtering by state at minimum
- visibility into ownership context where possible:
  - current or most recent task owner match
  - linked active task count if easy to derive
- recent activity section fed by existing session recency or lightweight JSON activity store

### Explicit non-goals for Phase 1
- no full staffing/org-management system
- no fine-grained permission management
- no detailed per-agent historical analytics
- no agent creation/deletion admin UI

### Acceptance criteria
- A user can scan which agents are active, stale, or offline in under one screen.
- The primary agent is visually obvious.
- At least one sort/filter path exists to isolate working, online, or offline agents.
- The page uses current CLI-derived data; it does not depend on a new complex backend before rendering basic value.

---

## 3) Tasks

### Purpose
Tasks is the operational board. It should preserve today’s task CRUD behavior while improving prioritization, ownership, blockers, and acceptance visibility.

### Must ship in Phase 1
- preserve current task creation flow
- preserve current status mutation actions
- task list upgraded into a clearer board/list optimized for:
  - priority
  - owner
  - status
  - autoRun
  - notifyOnComplete
  - updated time
- visible blocked section and in-progress section
- acceptance visibility:
  - show acceptance criteria when present in task data
  - if absent, continue to show notes/result summary without breaking
- page-level filtering at minimum for:
  - status
  - owner
  - priority or runnable tasks
- explicit task detail area or expanded card for:
  - notes
  - last error
  - result summary
  - timestamps

### Explicit non-goals for Phase 1
- no full kanban with drag-and-drop requirement
- no dependency graph editor
- no advanced sprint/reporting suite
- no cross-repo issue synchronization in the product UI

### Acceptance criteria
- All current task operations still function from the upgraded Tasks page.
- Blocked tasks are visually separated and easy to spot.
- Acceptance criteria are visible for seeded Phase 1 tasks from `data/tasks.json`.
- A user can quickly identify owner, priority, and latest state change for each important task.

---

## 4) Trading

### Purpose
Trading is the new workflow shell for market work. In Phase 1 it should provide a practical desk surface for watchlist, queue, alerts, thesis, and task linkage — without pretending the platform already has full execution capability.

### Must ship in Phase 1
- Trading page entry in the shell
- first-pass trading layout with four essential areas:
  1. watchlist
  2. execution queue
  3. alerts / catalysts
  4. thesis or setup detail panel
- ability to display linked tasks relevant to trading work
- data model can be JSON-backed initially; real-time market infra is not required for Phase 1
- each trading item should support a compact structure such as:
  - symbol / contract
  - asset type
  - direction or bias
  - status
  - thesis
  - trigger / next action
  - invalidation / risk note
  - linked task id
- clear empty states so the page is usable before live data is rich

### Explicit non-goals for Phase 1
- no broker connectivity
- no order entry/execution engine
- no advanced charting stack requirement
- no positions/PnL/risk engine with full portfolio accounting
- no research knowledge base page embedded into Trading

### Acceptance criteria
- Trading exists as a real navigable page, not a placeholder tab with no workflow.
- A user can view a watchlist, an execution queue, alerts, and a thesis/detail panel in one screen.
- Trading items can reference or surface linked Tasks, even if the first version is lightweight.
- The page supports manual/demo data via backend JSON contracts so frontend implementation can ship before deeper market integrations.

---

## Phase 1 backend/data implication
Backend does not need a rewrite. It only needs enough contract expansion to support the four pages.

### Existing contracts to preserve
- `GET /api/overview`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `GET /api/automation`
- `PATCH /api/automation`
- `POST /api/automation/tick`

### Likely minimal additions for Phase 1
- `GET /api/home` optional, or expand `/api/overview` to include home-oriented aggregates
- `GET /api/agents` optional if agent-specific shaping is cleaner than overloading overview
- `GET /api/trading`
- `PATCH /api/trading/:id` or lightweight write path only if needed for status/queue updates
- lightweight JSON stores for:
  - activity feed
  - trading watchlist / queue / alerts / thesis items

## Definition of done for Phase 1 scope
This scope is done when Design, Frontend, Backend, and Trading FE can implement without reopening page boundaries.

That means:
- each of the four core pages has a clear Phase 1 purpose
- must-ship items are explicit
- non-goals are explicit
- Research / Operations / System / Files are clearly out of scope for this phase
- the whole plan still reads as an upgrade of the current dashboard, not a different product

## Phase 2 boundary
The following are intentionally deferred:

### Research
- deep research workspace
- thesis library
- evidence capture and narrative drill-down
- source management and research review flows

### Operations
- KPI dashboards
- throughput / conversion / review cadence analytics
- team-level operating metrics and retrospectives

### System
- gateway controls
- deployment/admin/security surfaces
- environment diagnostics
- auth/logging administration

### Files
- document browser
- upload/index/search UI
- file-to-task or file-to-research linking workflows

## Recommended handoff from this document
- Designer: convert this scope into panel hierarchy and information priority
- Trading FE: refine the Trading workflow inside this boundary
- Backend Engineer: define minimum contracts/data stores to satisfy these pages
- Frontend Engineer: implement shell + nav + page entry surfaces without breaking current task/automation behavior
