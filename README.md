# TalentSync

> Mongo Hackathon 2026 submission track: `Recommendation Engine`

TalentSync is a recommendation-driven job matching platform for Mongo Hackathon 2026. The current codebase already provides the operational foundation of a two-sided job portal: recruiter job management, applicant profiles, resume upload, authentication, and application tracking.

This README reframes the project around the hackathon goal: transform a standard job board into a personalized job recommendation engine powered by MongoDB.

## Current Version

Current repository version signals:

- Workspace: `talentsync` in `package.json`
- Server: `1.0.0` in `server/package.json`
- Client: `0.0.0` in `client/package.json`

In practice, the current implementation is best described as:

> `TalentSync v1 foundation` - a working MERN job portal baseline, not yet a fully implemented recommendation engine.

## Hackathon Fit

Mongo Hackathon 2026 requires teams to build a `Recommendation Engine` and clearly show how MongoDB is used in the architecture, especially:

- `MongoDB Vector Search` for semantic/similarity retrieval
- `Aggregation Pipeline` for ranking, filtering, collaborative logic, or recommendation tuning
- A clear end-to-end use case
- A demoable MVP
- Architecture and data schema documentation

TalentSync fits this theme naturally:

- users already have profiles and resumes
- recruiters already publish jobs
- the platform already stores job/application interactions
- these signals can evolve into recommendation inputs

## Product Vision

TalentSync aims to recommend the right jobs to the right candidates using a mix of:

- profile-based matching
- resume/skill similarity
- behavioral signals from applications and browsing
- recruiter-side ranking signals
- business constraints such as location, job type, and recency

### Recommendation Direction

Planned hackathon-aligned recommendation flow:

1. Build a candidate profile from resume, skills, and user activity.
2. Represent jobs and/or candidate profiles as searchable vectors.
3. Use `MongoDB Vector Search` to retrieve semantically relevant job candidates.
4. Use `Aggregation Pipeline` to filter, score, rerank, and diversify results.
5. Return a personalized ranked list of job opportunities.

## What Already Exists

The current codebase already includes these useful building blocks:

### Applicant Side

- browse job listings
- filter/search jobs
- apply to jobs
- upload/manage resume
- track applications

### Recruiter Side

- recruiter/company authentication
- create job postings
- manage posted jobs
- review candidate applications
- basic dashboard workflows

### Platform/Infra

- MERN architecture
- MongoDB with Mongoose
- Clerk authentication
- Cloudinary file upload
- Sentry instrumentation
- Tailwind-based responsive UI

## Hackathon Scope: Current vs Target

### Current State

The repository is currently a job portal MVP with matching-oriented UX language in some places, but the core recommendation engine is not yet implemented end to end.

### Target State for Submission

To become strongly aligned with the hackathon brief, the project should demonstrate:

- personalized job recommendations
- explicit `Vector Search` usage
- explicit `Aggregation Pipeline` usage
- explainable recommendation logic
- clear schema and system architecture
- a polished demo flow under 10 minutes

## Proposed MongoDB-Centric Architecture

### Core Collections

- `users`
- `companies`
- `jobs`
- `jobapplications`
- `user_events` or equivalent interaction history
- optional `recommendation_snapshots` for cached results/experiments

### Recommendation Inputs

Useful signals available or easy to add on top of the current product:

- resume text
- candidate skills
- saved/applied jobs
- viewed jobs
- preferred location
- job category / role intent
- recruiter job metadata

### Recommendation Pipeline

Example hackathon-ready approach:

- embed job descriptions, required skills, and candidate profile text
- run `Vector Search` to retrieve top-N relevant jobs
- use `Aggregation Pipeline` to:
  - remove already-applied jobs
  - filter by location/type/seniority
  - boost recent jobs
  - boost matching skills
  - optionally blend collaborative signals
- return top personalized recommendations

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Framer Motion

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Bcrypt
- Multer

### Third-Party Services

- Clerk
- Cloudinary
- Sentry
- Svix

## Repository Structure

```text
.
├─ client/   # React frontend
├─ server/   # Express API + MongoDB models/routes/controllers
├─ docs/     # Hackathon context and workshop notes
└─ package.json
```

## Local Setup

### Prerequisites

- Node.js `18+`
- `pnpm`
- MongoDB Atlas account
- Clerk account
- Cloudinary account
- Sentry account

### Install

```bash
pnpm install
```

### Environment Variables

Create `.env` files in both `server/` and `client/`.

#### `server/.env`

```env
MONGODB_URI=your_mongodb_uri
CLERK_SECRET_KEY=your_clerk_secret_key
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SENTRY_DSN=your_sentry_dsn
CLERK_WEBHOOK_SECRET=your_svix_webhook_secret
PORT=5000
```

#### `client/.env`

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_BASE_URL=http://localhost:5000/api
```

### Run Locally

```bash
pnpm dev:server
pnpm dev:client
```

## Demo Narrative for Hackathon

Suggested demo storyline for the final submission:

1. Recruiter creates a job with skill-rich metadata.
2. Candidate uploads resume and completes profile.
3. Platform derives recommendation context from profile + behavior.
4. `Vector Search` retrieves semantically similar jobs.
5. `Aggregation Pipeline` reranks and filters the results.
6. Candidate receives a personalized job feed.
7. Candidate applies; interaction data improves future recommendations.

## Submission Checklist Mapping

This repository should ultimately support these hackathon deliverables:

- demo video under `10 minutes`
- clear use case explanation
- explicit MongoDB architecture
- data schema explanation
- clear explanation of `Vector Search`
- clear explanation of `Aggregation Pipeline`

## Important Note

At this stage, the repository should be presented honestly as:

- a strong foundation for a recommendation-engine submission
- not yet the final hackathon-complete recommender

That positioning is stronger than overclaiming features that the current codebase does not yet implement.

## License

Current repository metadata does not include a root LICENSE file. Before final submission or public distribution, define and document the intended license/usage terms explicitly.
