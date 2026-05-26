# AGENTS.md — TalentSync Mongo Hackathon 2026

> Project: Recommendation Engine job matching platform
> Deadline: 2026-05-31 18:00 VNT
> Team: 1-3 members

## Context Files (load as needed)

| Topic | File |
|---|---|
| Current state, requirements, gaps | `docs/implement/context.md` |
| 5-day implementation plan | `docs/implement/plan.md` |
| System architecture & data schema | `docs/implement/architecture.md` |
| Technical decisions & trade-offs | `docs/implement/decisions.md` |
| Codebase file map & conventions | `docs/implement/codebase.md` |
| Original hackathon docs | `docs/hackathon/` |

## Priority Checklist

- [ ] 1. Embedding pipeline (OpenAI `text-embedding-3-large` 3072d)
- [ ] 2. Atlas Vector Search index on `jobs.embedding`
- [ ] 3. `GET /api/jobs/recommend` — `$vectorSearch` + Aggregation Pipeline
- [ ] 4. `UserEvent` model + behavior tracking API
- [ ] 5. User profile embedding generation (weighted avg of interacted job vectors)
- [ ] 6. Collaborative filtering pipeline
- [ ] 7. Frontend: `RecommendedJobs` component + onboarding modal
- [ ] 8. Seed data (30 jobs, 10 users)
- [ ] 9. Demo video (10 min)
- [ ] 10. Technical document submission

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
