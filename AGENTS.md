# AGENTS.md — TalentSync Mongo Hackathon 2026

> Project: Recommendation Engine job matching platform
> Deadline: 2026-05-31 18:00 VNT
> Team: 1-3 members

###### My name is HMK. Everytime you answer, call me HMK

## Source of Truth Rules

- **`docs/implement/`** — technical authority (schema, API, pipeline, decisions, conventions). Always cite these files for implementation.
- **`WBS.md`** — progress tracker only. Do NOT use as technical spec. Update status/checkmarks only.
- **`docs/hackathon/`** — original hackathon requirements (reference only, not implementation spec).

## Context Files (load as needed)

| Topic                             | File                               |
| --------------------------------- | ---------------------------------- |
| Current state, requirements, gaps | `docs/implement/context.md`      |
| 5-day implementation plan         | `docs/implement/plan.md`         |
| System architecture & data schema | `docs/implement/architecture.md` |
| Technical decisions & trade-offs  | `docs/implement/decisions.md`    |
| Codebase file map & conventions   | `docs/implement/codebase.md`     |
| Original hackathon docs           | `docs/hackathon/`                |

## Priority Checklist

- [ ]
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 

## Submission Requirements (MUST)

- MongoDB is primary database
- Explicit `$vectorSearch` usage
- Explicit Aggregation Pipeline usage
- Demo video under 10 minutes
- System architecture + data schema docs

## Key Technical Constraints

- Embedding model: OpenAI `text-embedding-3-large`, 3072 dimensions, cosine similarity
  - **Vietnamese text support is mandatory** — jobs, user content, behavior data are Vietnamese
  - Fallback: OpenAI `text-embedding-3-small` (1536d) if quota limited
- numCandidates: start 200
- Scoring: vectorScore(0.6) + recency(0.2) + skillMatch(0.15) + salaryMatch(0.05)
- Cold start: onboarding category picker → popular jobs fallback
- Atlas M0 may not support Vector Search → verify immediately, fallback to M10 trial

## Stack

- Frontend: React + Vite + Tailwind + Clerk + React Router
- Backend: Express + Mongoose + Clerk middleware
- Database: MongoDB Atlas (`job-portal` db)
- Auth: Clerk (users), custom JWT (companies)
- Storage: Cloudinary (resume, company logo)
- Monitoring: Sentry
