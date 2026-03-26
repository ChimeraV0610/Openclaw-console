# Phase 1 Trading Workflow

_Last updated: 2026-03-26 00:45 America/New_York_

## Goal
Define the Trading page workflow skeleton for Phase 1 so the console supports a trader's fastest daily loop without pretending to be a full execution terminal.

## Phase 1 role of Trading
Trading is a **workflow shell** for:
- scanning the watchlist
- checking alerts / catalysts
- deciding what deserves action now
- reviewing the active thesis
- moving an item into the execution queue
- linking that item back to a task

It is **not** a broker UI, chart workstation, or portfolio accounting system in Phase 1.

## Core user loop
The default low-friction loop should be:
1. **Scan watchlist** for the names/contracts that matter now
2. **See alerts/catalysts** that explain why anything changed
3. **Open thesis/detail panel** for the selected item
4. **Confirm next action**: watch / prep / queue / block / close
5. **Check execution queue** for items that need near-term action
6. **Open linked task** when the item requires research, implementation, review, or follow-up

This loop should work in one screen with minimal navigation.

## Phase 1 panel hierarchy
### Row 1: trading summary band
Must answer in seconds:
- how many priority watchlist items exist
- how many queue items are live now
- how many risk/alert flags are open
- how many linked task hooks exist

Purpose:
- quick desk reset after refresh
- immediate triage without reading the full page

### Column A: watchlist
Purpose:
- primary scanning surface
- first interaction target

Each item should show:
- symbol / contract
- bias or direction
- state/status
- short catalyst or summary
- owner if relevant
- priority / conviction if available

Primary actions:
- select item
- promote to queue
- open linked thesis/detail

### Column B: thesis / setup detail
Purpose:
- explain *why this item matters now*
- anchor discipline before action

Must show:
- thesis summary
- next action
- trigger / why now
- invalidation / risk note
- linked task reference

Optional if available:
- timeframe
- asset type
- confidence

This panel should update from a single click on the watchlist or queue.

### Column C upper: execution queue
Purpose:
- near-term action surface
- smaller, tighter, more decisive than watchlist

Each item should show:
- title or symbol
- queue status
- owner
- next action
- recency / updated time

Primary actions:
- mark ready
- mark blocked
- remove from queue back to watchlist
- jump to linked task

### Column C lower: alerts / catalysts
Purpose:
- explain urgency and risk
- surface what changed without forcing users to hunt

Each alert should show:
- severity
- title
- short reason
- linked item(s) or task(s)

Primary actions:
- open affected item
- dismiss only when no longer relevant

### Bottom/right support area: linked tasks
Purpose:
- tie trading workflow to the broader console
- prevent thesis/action from drifting away from execution ownership

Each linked task preview should show:
- task title
- owner
- status
- priority
- latest result summary or blocker note

Primary action:
- jump into Tasks context or update the task state

## Low-friction interaction rules
### 1) Single-click selection
Clicking a watchlist or queue item should immediately update the thesis panel.
No extra modal or route change should be required.

### 2) No deep nesting
Core actions should be visible on the same surface.
Phase 1 should avoid hiding key actions behind multiple drawers, tabs, or menus.

### 3) Triage first, detail second
The page should help users decide **where to look** before it asks them to read a lot.
That means summary band + watchlist + alerts must stay highly scannable.

### 4) Queue is the action zone
Watchlist is broad; queue is committed attention.
The UI should make that distinction visually obvious.

### 5) Risk note always visible near action
If an item has an invalidation or risk note, it should appear in the thesis panel without extra clicks.

### 6) Empty states should teach the workflow
If data is sparse, empty states should explain what belongs there:
- watchlist = names to monitor
- queue = items ready for action soon
- alerts = catalysts or risk flags
- linked tasks = execution or research follow-through

## Component ownership boundary
### Frontend Engineer owns
- overall page shell
- section layout
- routing/navigation integration
- generic list-card behavior
- shared panel styling and responsive behavior

### Trading FE owns
- workflow order
- what fields appear in watchlist / queue / thesis / alerts
- decision-state language
- low-click interaction rules
- what counts as “promote to queue”, “needs review”, “blocked”, or “ready”

### Backend Engineer owns
- JSON contract shape
- persistence for watchlist / queue / alerts / theses
- linked task references
- stable API payloads for Trading page

## Minimal status vocabulary
Recommended Phase 1 states:
- watch
- active
- queued
- ready
- blocked
- closed

Recommended alert severities:
- low
- medium
- high

## Minimal Trading item schema
A Trading item should support at least:
- `id`
- `symbol` or `title`
- `assetType`
- `bias`
- `status`
- `summary` / `thesis`
- `nextAction`
- `trigger`
- `invalidation`
- `owner`
- `linkedTaskIds`
- `updatedAt`

## Fastest common paths
### Path A: scan to thesis
1. open Trading
2. click watchlist item
3. read thesis / trigger / invalidation
4. decide keep watching vs queue

### Path B: alert to queue
1. see alert
2. open affected item
3. confirm catalyst and risk
4. move into execution queue
5. verify linked task exists

### Path C: queue to task follow-through
1. open queue item
2. review next action
3. jump to linked task
4. update task status / blocker / result
5. return to Trading without losing context

## Acceptance mapping
This document satisfies Trading FE acceptance when:
- the Trading page workflow skeleton is explicit
- low-click path is defined
- key action zones are identified
- the boundary with Frontend Engineer is clear

## Implementation note for current codebase
Current `public/app.js` already supports:
- summary bands
- watchlist list cards
- execution queue list cards
- thesis/detail panel
- alerts panel
- linked tasks panel

So the next implementation step is refinement of field priority and state language, not reinvention of the Trading page structure.
