# Orchestrator Unified Logging

## Rule
The Orchestrator (GPT) must write a row to Supabase table `agent_logs` before sending the final reply to the user.

This applies to:
- direct Orchestrator answers
- delegated specialist work summarized by the Orchestrator
- failed tasks
- partial completions that are being returned as a status update

## Supabase target
- URL: `https://riturspahlxpynmvsdxi.supabase.co`
- Table: `agent_logs`
- Anon key: configured operationally by the Orchestrator workflow

## Required fields
- `agent_name`: `GPT` or `Orchestrator`
- `task_description`: short summary of what was completed or attempted
- `model_used`: actual active model
- `status`: `completed` or `failed`

## Execution order
1. Finish the orchestration / synthesis work
2. Write the Supabase log row
3. Verify the write succeeded
4. Only then send the final reply

## Principle
If logging fails, the task is not fully closed from an operational perspective.
