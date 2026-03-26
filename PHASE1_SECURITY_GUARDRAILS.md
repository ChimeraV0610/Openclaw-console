# Phase 1 Security & Deployment Guardrails

_Last updated: 2026-03-26 01:05 America/New_York_

## Goal
Define the minimum deployment and security guardrails for the Phase 1 console so the existing dashboard can be extended and deployed without accidental exposure, path confusion, or unsafe live edits.

## Scope
This is a **Phase 1 guardrail brief**, not a full host hardening run.
It focuses on:
- canonical path boundaries
- live served path risk
- `HOST` / `BASE_PATH` exposure assumptions
- deployment hygiene
- minimum auth/logging/exposure recommendations

It does **not** claim to harden SSH, firewall, OS patching, or VPS services directly.

## Canonical path boundaries
### 1) Canonical implementation path
Primary source of truth for console work:
- `C:\Users\kylez\.openclaw\workspace-gpt`

Files that matter most:
- `server.js`
- `public/index.html`
- `public/app.js`
- `public/styles.css`
- `data/*.json`

Rule:
- all Phase 1 code changes should originate here first

### 2) Non-canonical draft path
Draft-only / non-authoritative path:
- `C:\Users\kylez\.openclaw\workspace-dev\index.html`

Risk:
- teams may accidentally treat this as product truth
- live fixes may fork between dev draft and canonical workspace

Guardrail:
- do not deploy from `workspace-dev`
- do not review `workspace-dev` as if it were the production branch
- if a useful idea exists there, port it explicitly into `workspace-gpt`

### 3) VPS live served path
Current live-served path:
- `/root/.openclaw/workspace/agent-dashboard/index.html`

Risk:
- this is outside the canonical local workspace
- it invites direct hot-editing on the VPS
- drift can appear between local canonical code and live file
- root-owned live artifacts make least-privilege discipline worse

Guardrail:
- treat the VPS path as a deployment target, not an editing workspace
- do not use the live file as the source for new product decisions
- sync to VPS only from reviewed canonical local output

## Current code-level exposure observations
## 1) Bind address defaults are relatively safe
`server.js` currently defaults to:
- `HOST = 127.0.0.1`
- `PORT = 3187`

Why this is good:
- local dev is not exposed to the whole network by default

Risk:
- setting `HOST=0.0.0.0` or another public bind widens exposure immediately

Guardrail:
- keep default local development on `127.0.0.1`
- only bind to broader interfaces intentionally
- if broader binding is required, place the app behind a reviewed reverse proxy or private network first

## 2) BASE_PATH support is useful but easy to misconfigure
`server.js` and `public/app.js` support `BASE_PATH`.

Why this matters:
- helpful for reverse-proxy subpaths
- but easy to break static paths or accidentally expose the app from an unexpected root

Guardrail:
- define `BASE_PATH` explicitly in VPS deployment if serving under a subpath
- ensure proxy and app agree on the same prefix
- never guess path rewrites directly on the live host
- verify `/api/*` and static assets both work under the chosen path

## 3) No authentication layer is visible in current app code
The current Node server exposes task, automation, activity, and trading routes directly.

Risk:
- if the server is exposed publicly, anyone who reaches it may read internal operational data and mutate workflow state
- writable routes include task updates, trading updates, automation toggles, and activity writes

Guardrail:
- Phase 1 should assume this app is **not safe for unauthenticated public internet exposure**
- keep it on localhost, LAN-trusted boundary, tailnet, VPN, or authenticated reverse proxy until auth exists
- do not expose raw Node port 3187 directly to the public internet without an additional access control layer

## 4) Writable operational endpoints increase blast radius
High-impact routes include:
- `PATCH /api/tasks/:id`
- `PATCH /api/trading`
- `PATCH /api/automation`
- `POST /api/automation/tick`
- `POST /api/activity`
- `POST /api/tasks`

Risk:
- accidental or malicious mutation of console state
- fake activity/event injection
- automation mode tampering

Guardrail:
- writable endpoints should remain inside trusted access only for Phase 1
- if remote access is needed, require upstream authentication before requests reach the app
- later phases should add application-level auth and possibly write-route protection

## Live-served path risks
### Risk 1: direct root-owned hot edits
Because the live file path is under `/root/...`, emergency edits may happen as root.

Why this is bad:
- increases chance of undocumented drift
- weakens rollback discipline
- normalizes privileged editing of product files

Minimum recommendation:
- build and review in canonical local workspace first
- deploy by copying reviewed artifacts, not by hand-editing live files in place

### Risk 2: local canonical vs live VPS divergence
The current architecture clearly separates:
- canonical local implementation
- live VPS served artifact

Why this is dangerous:
- teams may fix bugs live and forget to backport
- later work may overwrite hotfixes or resurrect stale code

Minimum recommendation:
- every live deployment should map to a known local commit
- if emergency live edits happen, backport them immediately to `workspace-gpt`

### Risk 3: false confidence from a static-looking served path
The VPS currently serves a live `index.html`, but the actual Phase 1 app now includes:
- Node server behavior
- JSON stores
- API routes
- `BASE_PATH` handling

Why this matters:
- treating deployment as “just copy one HTML file” can break the app or silently bypass API expectations

Minimum recommendation:
- deploy the app as a coherent bundle: server + public assets + required data files
- do not assume `index.html` alone represents the full product anymore

## Minimum deployment model for Phase 1
Recommended order of safety:

### Preferred
1. run the app bound to localhost or private interface only
2. publish through a reverse proxy or tailnet/private network access
3. keep raw Node port off the public internet

### Acceptable with caution
1. bind more broadly only on a trusted private network
2. still avoid unauthenticated public access

### Not recommended
1. public exposure of the raw Node service on port 3187
2. direct unauthenticated internet access to writable `/api/*` routes
3. editing live app files directly under `/root/...` as the normal workflow

## BASE_PATH deployment guardrails
If the app is served at a subpath, for example `/agent-dashboard`:
- set `BASE_PATH=/agent-dashboard`
- ensure proxy routes preserve that prefix consistently
- verify:
  - page load works
  - `/api/overview` works through the prefix
  - static `app.js` and `styles.css` load correctly

Checklist before marking deploy healthy:
- no broken asset URLs
- no doubled path prefixes
- no missing API calls due to prefix mismatch

## Logging and audit trail minimums
Phase 1 should at least preserve:
- which local commit was deployed
- when deployment happened
- which target path was updated
- whether `HOST` or `BASE_PATH` were changed

Guardrail:
- if no formal deploy pipeline exists, keep a lightweight manual changelog with commit SHA + target path + timestamp
- avoid storing secrets/tokens in those notes

## Minimum auth and access recommendations
Until application auth exists, choose one of these patterns:

### Best current option
1. localhost bind + SSH tunnel / tailnet / VPN / reverse proxy auth

### Acceptable option
2. private LAN-only bind with trusted network boundary

### Avoid for Phase 1
3. public anonymous exposure

If browser control or sensitive assistant functions are attached to this environment, the stricter option should be preferred.

## Least-privilege notes
- avoid treating `root` as the normal editing identity for product changes
- prefer deploying artifacts rather than coding directly on the VPS
- keep ownership and permissions narrow where possible
- separate “serve the app” from “author the product” in workflow and habit

## Deployment checklist for Phase 1
Before deployment:
- confirm source is `workspace-gpt`, not `workspace-dev`
- confirm current work maps to a known git commit
- confirm `HOST` choice is intentional
- confirm `BASE_PATH` choice is intentional
- confirm required `public/*` and `data/*` files are included
- confirm no emergency-only local hacks remain

After deployment:
- load the shell successfully
- verify Home / Agents / Tasks / Trading routes in the UI
- verify `/api/overview` and `/api/trading` work
- verify task mutation still works from trusted access
- verify app is not exposed broader than intended

## Phase 1 security posture summary
Current app is suitable for:
- local development
- trusted-network use
- authenticated private publishing behind another control layer

Current app is **not** suitable for:
- direct unauthenticated public internet exposure
- root-edited live-only workflows
- assuming static-file-only deployment discipline

## Acceptance mapping
This document satisfies the Phase 1 security task when:
- live served path risk is explicit
- minimum security recommendations are listed
- Phase 1 deploy guardrails are defined
- canonical path boundaries are unambiguous

## Recommended next step after this brief
If a real deployment pass is planned next, the follow-up should be:
1. verify actual bind/proxy/public exposure on the target VPS
2. verify whether authentication exists upstream
3. produce a step-by-step deployment runbook tied to the real host configuration
