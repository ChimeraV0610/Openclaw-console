# HEARTBEAT.md

# Phase 1 coordination heartbeat
# Goal: market-command / Phase 1 = OpenClaw Gateway -> Sync Layer -> PostgreSQL

On heartbeat:

1. Read shared project brief:
   - `C:\Users\kylez\.openclaw\workspace\PROJECT_BRIEF.md`

2. Read shared Phase 1 status file:
   - `C:\Users\kylez\.openclaw\workspace\PHASE1_STATUS.md`

3. Check Phase 1 workspace status in:
   - `C:\Users\kylez\.openclaw\workspace\market-command`

4. Focus only on Phase 1 coordination:
   - current scaffold status
   - blocker status
   - what each agent reported
   - what GPT should report now
   - whether a new milestone or risk appeared

5. If there is a meaningful update, reply with a short Chinese progress report including:
   - 各 agent 当前进度
   - 当前 blocker
   - 下一步

6. If there is no meaningful change, reply exactly:
   - HEARTBEAT_OK

7. Do not expand scope beyond Phase 1.
8. Do not mention unrelated memory or old tasks.
