---
name: onboard
description: Load full TalentSync project context for new sessions. Use when starting a new conversation, returning after a gap, or when context was lost.
---

# Onboard — Load TalentSync Project Context

Analyze the provided documents to gain a comprehensive understanding of the TalentSync project context. Use the following files as your primary knowledge base:

- **Project Rules:** @AGENTS.md
- **Hackathon Documentation:** @docs/hackathon/
- **Technical Specifications:** @docs/implement/
- **Project Management:** @WBS.md (Work Breakdown Structure) and @CPM.md (Critical Path Method)
- **Codebase:** @client/ and @server/

After reading, produce a brief summary covering:
1. Current project state and highest-priority remaining tasks (from WBS.md and AGENTS.md checklist)
2. Technical architecture overview (from docs/implement/architecture.md)
3. Any blocking issues or decisions that need immediate attention (from docs/implement/context.md)
