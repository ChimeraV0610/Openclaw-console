# HEARTBEAT.md

# Task-board driven autonomy
# Primary task source: C:\Users\kylez\.openclaw\workspace-gpt\data\tasks.json

On heartbeat:

1. Read `C:\Users\kylez\.openclaw\workspace-gpt\data\tasks.json`
2. Find the highest-priority task where:
   - `autoRun = true`
   - `status` is `todo` or `in_progress`
3. If no such task exists, reply exactly:
   - HEARTBEAT_OK
4. If a task exists:
   - prefer continuing an `in_progress` task over starting a new `todo`
   - update the task status to `in_progress` if needed
   - update `startedAt` / `updatedAt`
   - work only on that task
5. While working:
   - do not ask the user for routine confirmation
   - only interrupt if blocked by permissions, ambiguity, external side effects, or missing credentials
6. When blocked:
   - set `status` to `blocked`
   - write a short `lastError`
   - reply with a short Chinese blocker report
7. When finished:
   - set `status` to `done`
   - set `completedAt`
   - write a short `resultSummary`
   - if `notifyOnComplete = true`, send a short Chinese completion message proactively
8. Always keep task fields current:
   - `status`, `owner`, `priority`, `updatedAt`, `startedAt`, `completedAt`, `lastError`, `resultSummary`
9. Do not invent new unrelated tasks.
