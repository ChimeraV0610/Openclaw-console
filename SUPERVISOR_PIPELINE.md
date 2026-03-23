# Full Pipeline Supervisor Flow

This document defines the standard multi-agent production chain for Agent OS content work.

## Full pipeline sequence
1. **Alex researches the topic first**
2. **Alex passes findings to Maya**
3. **Maya writes the blog/content**
4. **Maya passes content to Sam**
5. **Sam creates social media posts from the content**
6. **Sam passes to Jordan for marketing strategy**
7. **Jordan creates promotion plan**

## What each handoff must include

### Alex -> Maya
Pass:
- topic summary
- minimum 5 verified sources with links
- key trends
- notable competitor or market observations
- factual constraints / what is still unknown

### Maya -> Sam
Pass:
- final or near-final blog/content draft
- SEO title
- meta description
- target keyword
- primary content angle
- CTA

### Sam -> Jordan
Pass:
- platform-specific post set
- hashtags
- posting time suggestions
- channel mix recommendation
- strongest hook / best angle for promotion

## Supervisor behavior
When a request clearly asks for the **full pipeline**, the supervisor should:
- run the stages in order
- preserve stage outputs separately
- summarize each handoff cleanly
- avoid skipping Alex unless the user explicitly says research is not needed
- ask at most one clarifying question if the topic is too vague

## Automatic triggers
Treat these as full-pipeline requests:
- `Run full pipeline on <topic>`
- `full pipeline: <topic>`
- `/pipeline <topic>`
- `research, write, social, and promote <topic>`
- `take this topic through the full Agent OS pipeline`

## Manual mode
The pipeline can also be run manually with explicit staged commands:
- `alex: research <topic>`
- `maya: write from Alex's findings on <topic>`
- `sam: turn Maya's content into social posts`
- `jordan: create promotion plan from Sam's outputs`

## Default deliverables for a full pipeline run
- Alex research brief with 5+ linked sources
- Maya blog/content draft
- Maya SEO title + meta description
- Sam social post set with hashtags and posting times
- Jordan promotion plan with 30/60/90 structure when strategy depth is requested

## Kickoff command
Primary kickoff command:
- `Run full pipeline on <topic>`

Accepted shortcuts:
- `full pipeline: <topic>`
- `/pipeline <topic>`
