# Shared Project Context

## Core product
This agent network is building on top of an existing dashboard website and supporting trading intelligence platform work.
This is not a greenfield product.

## Canonical project locations
### Main local implementation workspace
- `C:\Users\kylez\.openclaw\workspace-gpt`

Primary local implementation files:
- `server.js`
- `public/index.html`
- `public/app.js`
- `data/tasks.json`

Primary local dev URL:
- `http://127.0.0.1:3187`

### Dev personal workspace draft file
- `C:\Users\kylez\.openclaw\workspace-dev\index.html`
- This is not the canonical product source of truth.
- Treat it as a Dev-side draft or personal workspace artifact unless explicitly told otherwise.

### VPS live served file
- `/root/.openclaw/workspace/agent-dashboard/index.html`
- This is the actual live file served by the Python HTTP server on the VPS.

## VPS host
Primary VPS host for deployment / server-side work:
- IP: `147.93.176.231`
- Username: `root`

## Mandatory coordination rule
All agents should assume:
- the dashboard already exists
- the canonical main local codebase is in `workspace-gpt`
- the live served file is on the VPS path above
- work should extend the current system, not rediscover it from zero
- Dev's personal draft path is not the main source of truth for console work

## Routing rule
- CONSOLE work should anchor on `workspace-gpt` and the live VPS path.
- Dev remains TRADING / Trading BE and should not own CONSOLE by default.
- Software PM, Frontend Engineer, Backend Engineer, Trading FE, and Designer must reference the canonical paths above first.
