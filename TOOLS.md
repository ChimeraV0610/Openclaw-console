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

Use these quick command shortcuts for specialist routing:

- `alex: <task>` or `/alex <task>` -> Alex (research)
- `maya: <task>` or `/maya <task>` -> Maya (content writing)
- `jordan: <task>` or `/jordan <task>` -> Jordan (marketing strategy)
- `dev: <task>` or `/dev <task>` -> Dev (coding)
- `sam: <task>` or `/sam <task>` -> Sam (social media)

Friendly natural-language aliases:
- `research: <task>` -> Alex
- `write: <task>` -> Maya
- `strategy: <task>` -> Jordan
- `build: <task>` / `code: <task>` -> Dev
- `social: <task>` -> Sam

Supervisor pipeline kickoff:
- `Run full pipeline on <topic>`
- `full pipeline: <topic>`
- `/pipeline <topic>`

Full routing examples live in `ROUTER_CHEATSHEET.md` and `SUPERVISOR_PIPELINE.md`.

Add whatever helps you do your job. This is your cheat sheet.
