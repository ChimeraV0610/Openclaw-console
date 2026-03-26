# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## Router Shortcuts

Main orchestrator behavior:
- All natural-language requests come to GPT first
- GPT decides whether Alex, Maya, Jordan, Dev, Sam, or the full supervisor pipeline should handle the work
- The final answer returns to Telegram here by default
- Discord channels are used for record-keeping when configured/available

Use these quick command shortcuts for specialist routing:

- `alex: <task>` or `/alex <task>` -> Alex (POLYMARKET / Alpha Researcher)
- `maya: <task>` or `/maya <task>` -> Maya (POLYMARKET / Risk Auditor)
- `jordan: <task>` or `/jordan <task>` -> Jordan (SYSTEM / Guardian)
- `dev: <task>` or `/dev <task>` -> Dev (TRADING / Trading BE)
- `sam: <task>` or `/sam <task>` -> Sam (SYSTEM / Monitor)

Friendly natural-language aliases:
- `research: <task>` -> Alex
- `risk: <task>` -> Maya
- `guardian: <task>` -> Jordan
- `build: <task>` / `infra: <task>` -> Dev
- `monitor: <task>` -> Sam

Trade-facing default escalation:
- research / monitor -> risk review -> guardian check -> orchestrator synthesis

Additional seats now available:
- `coo: <task>` -> COO
- `security: <task>` -> Security
- `hr: <task>` -> HR
- `quant-pm: <task>` -> Quant PM
- `quant-engineer: <task>` -> Quant Engineer
- `polymarket-trader: <task>` -> Polymarket Trader

Full routing examples live in `ROUTER_CHEATSHEET.md` and `TRADING_ORG.md`.

Add whatever helps you do your job. This is your cheat sheet.
