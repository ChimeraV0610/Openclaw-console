# Shared Skills

All agents should assume these additional skills are installed in the main workspace and available to support work when relevant.

## Installed skills

### self-improving
- Name: Self-Improving + Proactive Agent
- Use for: self-reflection, corrections, learning from mistakes, proactive follow-through, persistent improvement patterns.
- Trigger examples:
  - a command/tool/API fails
  - user rejects output or corrects a mistake
  - a better method is discovered
  - recurring maintenance / memory organization is needed

### word-docx
- Name: Word / DOCX
- Use for: creating, inspecting, and editing `.docx` files safely.
- Especially useful when tracked changes, numbering, comments, tables, templates, or formatting stability matter.

### docker-compose
- Name: Docker Compose
- Use for: defining and managing multi-container apps, networking, volumes, healthchecks, and dependency ordering.
- Important for deployment/infrastructure workflows.

### openclaw-tavily-search
- Name: Tavily Search
- Use for: web research via Tavily API when agent-oriented web research is useful or when an alternative to Brave/Gemini search is needed.
- Tavily API is configured operationally in `C:\Users\kylez\.openclaw\.env`.
- Returns result lists and can provide short answer summaries.

## Working rule
- These skills are shared capabilities for the organization.
- Agents should use them when the task clearly matches the skill.
- Do not assume every task needs them; use selectively.
- For market research and current-info lookups, Tavily can be used as a supplemental research path.
