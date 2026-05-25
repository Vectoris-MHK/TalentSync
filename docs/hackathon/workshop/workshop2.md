# Workshop 2 Agent Context Master — Aggregation Pipeline & Collaborative Filtering

> Program: `MUGVN × MongoDB Mini Hackathon 2026`
>
> Purpose: single-file, agent-first source of truth for hackathon/workshop context.
>
> Source policy: normalized from Vietnamese intro emails + workshop transcript. No external knowledge added. English rewrite for technical stability. Keep source confidence labels:
> - `Confirmed` = explicit in transcript or supporting hackathon docs
> - `Synthesized` = merged from multiple transcript segments, still faithful to speaker intent
> - `Uncertain` = noisy transcript / ambiguous wording / should be checked against recording or slides before treated as exact fact

---

## Program Context

- `Confirmed` Hackathon: `Mongo Hackathon 2026`, organized by `MongoDB User Group Vietnam (MUGVN)` with MongoDB support.
- `Confirmed` Core challenge: build a `Recommendation Engine` for products, movies, music, or another domain.
- `Confirmed` MongoDB must be part of the architecture.
- `Confirmed` Workshop 1: `MongoDB Vector Search & Similarity Search`.
- `Confirmed` Workshop 2: `Aggregation Pipeline & Collaborative Filtering`.
- `Confirmed` Workshop 2 date/time: `May 22, 2026`, `12:30–13:30 VNT`, online.
- `Confirmed` Workshop 2 agenda from invite email:
  - design aggregation pipelines for recommendation systems
  - build collaborative filtering from user behavior
  - combine `Vector Search + Aggregation Pipeline` into one complete pipeline
  - Q&A
- `Confirmed` Completing both workshops is tied to eligibility for `100 USD` MongoDB certification credit, subject to organizer conditions.

---

## Hackathon Constraints

- `Confirmed` Submission deadline: `May 31, 2026, 18:00 VNT`.
- `Confirmed` Required submission assets:
  - demo video under 10 minutes
  - technical document
  - system architecture
  - data schema
- `Confirmed` Demo video must include:
  - use case introduction
  - product demo
  - results / notable outcomes
- `Confirmed` Submission language: Vietnamese or English.
- `Confirmed` MongoDB must be the primary database.
- `Confirmed` Teams must clearly describe how `Vector Search` and `Aggregation Pipeline` are used.
- `Confirmed` Judging criteria:
  - `30%` creativity
  - `30%` technical quality / MongoDB integration / scalability
  - `30%` practical impact
  - `10%` presentation quality

---

## Why Workshop 2 Matters

- `Confirmed` Speaker positions `Aggregation Pipeline` as foundational for this year’s recommendation-engine challenge.
- `Synthesized` Workshop 1 teaches semantic retrieval primitives.
- `Synthesized` Workshop 2 teaches how to turn retrieval into a usable recommendation system.
- `Confirmed` Main transition:
  - Workshop 1 → create/store/query vectors
  - Workshop 2 → join behavior, scoring, filtering, reranking, business logic

---

## Core Mental Model

- `Confirmed` Recommendation system framing: represent `user` and `item` in the same vector space.
- `Confirmed` Nearest items to the user vector are more likely to be relevant.
- `Synthesized` `Vector Search` alone is not the full recommender.
- `Synthesized` Complete recommendation flow needs:
  - candidate retrieval
  - user behavior interpretation
  - business filtering
  - ranking / reranking
  - output cleanup
  - final ranked list
- `Confirmed` Output type differs from RAG:
  - RAG input: text question → output: answer
  - recommendation input: user behavior/signals → output: ranked personalized list

---

## Agent Operating Guidance

- `Confirmed` Treat this file as the main context file for hackathon/workshop understanding.
- `Confirmed` Treat hackathon dates, eligibility notes, judging criteria, and submission checklist as stable program facts.
- `Confirmed` Treat recommendation flow, user-profile logic, collaborative-filtering steps, and tuning advice as workshop truth.
- `Uncertain` Treat exact model names, some dimensions, some percentages, and some feature-brand names as noisy unless cross-checked.
- `Uncertain` Treat copyright/legal comments in Q&A as practical speaker guidance, not formal legal advice.
- `Synthesized` If an implementation decision depends on exact vendor/model naming, re-check transcript, slide, or official docs.

---

## End-to-End Recommendation Architecture

### Architecture Shape
- `Confirmed` Speaker describes an end-to-end system with `8 layers`, split into `2 groups`.
- `Confirmed` Group 1 = `offline/batch` or stream-consumer style layers.
- `Confirmed` Group 2 = `online/request-time` layers triggered when users open the app or browse feeds.
- `Uncertain` Exact slide labels for all 8 layers are noisy in transcript; functional roles are clearer than names.

### Offline / Batch Layers
- `Confirmed` `Ingestion` layer:
  - input sources include `user events` and `catalog` data
  - if data is not already in MongoDB, an ingestion layer is needed
  - speaker references `CDC`, `Kafka`, `Debezium`, `Oracle GoldenGate`
- `Confirmed` `Embedding generation` layer:
  - convert `text` or `image` into vectors
  - examples referenced: `Voyage AI`, `OpenAI`, other models
  - this step can be token-cost heavy
- `Confirmed` `Vector index` layer:
  - vectors must be indexed after generation
  - query vector dimensionality must match indexed dimensionality
- `Confirmed` `Precomputed user profile` layer:
  - compute user preference representations before request time
  - precompute cost < request-time recompute cost

### Online / Request-Time Layers
- `Confirmed` `Cache` layer:
  - may use `Redis`
  - may also benefit from MongoDB working-set behavior
- `Synthesized` `Candidate retrieval` layer:
  - retrieve semantically relevant items using vector search
- `Confirmed` `Join / enrich / filter / rerank` layer:
  - use `lookup`
  - use cleanup/post-filtering
  - use reranking
  - prevent duplicates
  - apply sort order
- `Confirmed` Final output = `ranked personalized list`, not single answer text

---

## Data Model Signals

### Main Entities
- `Synthesized` `User` = identity + preference state + behavior history
- `Confirmed` `Item` / `Catalog` = recommendable object, with fields like title, description, price, metadata, embedding
- `Synthesized` `Interaction` / `Behavior log` = events linking users to items

### Signal Types Mentioned
- `Confirmed` Speaker references behavior signals such as:
  - `view`
  - `click`
  - `like`
  - `rating`
  - `purchase`
- `Synthesized` These signals feed user profiling, collaborative filtering, and scoring.

---

## User Profile Strategy

### Base Rule
- `Confirmed` No single standard formula exists for user profiles.
- `Confirmed` User-profile design depends on scale, available signals, and product needs.

### Simple Construction Method
- `Confirmed` Split user behavior into event types.
- `Confirmed` Assign a weight to each event type.
- `Confirmed` Example logic from transcript:
  - `view` = lower weight
  - `purchase` = higher weight
- `Synthesized` Weighted events combine into a preference representation, then into stored profile/vector state.

### Short-Term vs Long-Term Preference
- `Confirmed` One vector may not represent the user well enough.
- `Confirmed` Speaker suggests `dual profile`:
  - short-term profile
  - long-term profile
- `Confirmed` These can be combined with fusion/rank-fusion style retrieval.
- `Synthesized` This supports cases where immediate intent differs from stable preference.

### Precompute Principle
- `Confirmed` Precompute user profiles whenever practical.
- `Confirmed` Runtime-only computation is more expensive.
- `Synthesized` Batch compute → lower online latency and lower request-time complexity.

---

## Collaborative Filtering Flow

### Four-Step Logic
- `Confirmed` Step 1: find items with positive interaction from the target user.
- `Confirmed` Step 2: find other users who also positively interacted with those items.
- `Confirmed` Step 3: collect items preferred by those similar users.
- `Confirmed` Step 4: use aggregation to score and rank those items.

### Reasoning Model
- `Synthesized` Shared positive interactions imply shared preference neighborhoods.
- `Synthesized` Items liked by neighboring users become candidate recommendations.

### Why This Matters
- `Confirmed` Speaker presents this as a simple, practical recommender design.
- `Synthesized` Strong fit for hackathon MVP because it is understandable, explainable, and implementable quickly.

---

## Aggregation Pipeline Role

### Primary Job
- `Confirmed` Aggregation Pipeline is the main tool for:
  - query logic
  - joins
  - scoring
  - filtering
  - reranking support
  - output shaping

### Database-Layer Tuning
- `Confirmed` Speaker explicitly frames the material as tuning recommendation results at the database layer.
- `Synthesized` Goal: reduce dependence on backend/application post-processing for core ranking logic.

### Pipeline Stages Mentioned
- `Confirmed` candidate retrieval conditions
- `Confirmed` post-filter / cleanup
- `Confirmed` `lookup` across collections
- `Confirmed` `group` for diversity / anti-duplication
- `Confirmed` final `sort`
- `Confirmed` deduplication logic

### Business Logic Injection
- `Confirmed` Recommendation should not return blocked/disliked brands or irrelevant items.
- `Confirmed` Recommendation should consider inventory/availability-like business value constraints if relevant.
- `Synthesized` Aggregation Pipeline is where semantic relevance gets fused with business rules.

### Diversity Tuning
- `Confirmed` Speaker warns against returning only one brand/type repeatedly.
- `Confirmed` `group` or similar logic can diversify results.
- `Synthesized` Precision-only ranking can degrade UX; diversity is a real tuning axis.

---

## Vector Search + Aggregation Pipeline Pattern

### Canonical Flow
- `Synthesized` Recommended mental flow from workshop:
  1. collect user events + item/catalog data
  2. ingest into MongoDB
  3. generate embeddings
  4. build vector indexes
  5. precompute user profiles
  6. retrieve candidates with vector search
  7. enrich/filter/rerank using aggregation pipeline
  8. return final ranked list

### Retrieval vs Ranking Split
- `Synthesized` `Vector Search` handles semantic candidate retrieval.
- `Synthesized` `Aggregation Pipeline` handles business-aware ranking and cleanup.
- `Confirmed` Speaker repeatedly emphasizes overall flow before deep implementation detail.

---

## Cold Start Guidance

### New User Initialization
- `Confirmed` Most direct approach: onboarding wizard asking user interests.
- `Confirmed` Alternative: use signup data if the product wants less friction.
- `Confirmed` Example signup-derived signals mentioned:
  - social references
  - website links
  - profile-like fields
- `Confirmed` If website/reference data exists, metadata can be extracted from it.
- `Confirmed` If little data exists, age/year-of-birth may still provide weak initialization.
- `Confirmed` Larger systems may force answers to a few onboarding questions.
- `Synthesized` Practical cold-start strategy = explicit onboarding first, weak metadata fallback second, coarse demographic fallback last.

---

## Trade-Offs and Tuning Points

### Precompute vs Runtime
- `Confirmed` Precompute profiles when possible.
- `Synthesized` Trade-off:
  - more offline complexity
  - lower online cost and latency

### Simple MVP vs Deep Optimization
- `Confirmed` Speaker recommends starting simple.
- `Confirmed` Do not go deep into complexity before the overall design is clear.
- `Synthesized` Hackathon value = clear end-to-end system > premature sophistication.

### Precision vs Diversity
- `Confirmed` Pure nearest-result ranking can over-concentrate on one brand/category/type.
- `Confirmed` Aggregation can diversify output.

### Cost vs Quality
- `Confirmed` Embedding generation has token cost.
- `Confirmed` Model choice varies by quality, latency, cost, domain fit, multimodal needs.
- `Uncertain` Exact model table details in transcript are noisy.

### Semantic Similarity vs Business Constraints
- `Confirmed` Nearest semantic result is not automatically the best product result.
- `Confirmed` Apply filters such as dislike/block/business-value constraints.

---

## Model / Embedding Notes

- `Confirmed` Speaker references multiple model categories:
  - general-purpose balance
  - higher-accuracy model
  - lighter / cheaper model
  - domain-specific variants
  - multimodal embedding model
  - rerank model
- `Confirmed` Key engineering rule: embedding/index dimensionality must stay compatible.
- `Uncertain` Exact product names, dimensions, and pricing from transcript are not stable enough for precise technical citation.

---

## Q&A Distillation

### Q1. How to build a user personalization profile?
- `Confirmed` Start from behavior events.
- `Confirmed` Weight event types differently.
- `Confirmed` Combine into a profile representation.
- `Confirmed` Consider separate short-term and long-term profiles.

### Q2. Is `Vector Search + Aggregation Pipeline` or even `RAG` acceptable for the hackathon?
- `Confirmed` Organizers do not restrict teams to one exact solution pattern.
- `Confirmed` Workshops focus on MongoDB foundations, not hard submission constraints.
- `Confirmed` More creativity is acceptable if the solution is strong.

### Q3. How to handle cold start for a newly registered user?
- `Confirmed` Use onboarding wizard if possible.
- `Confirmed` If not, use signup data or linked metadata sources.
- `Confirmed` If even that is sparse, use broad demographic similarity as a weak bootstrap.

### Q4. Can movie recommendation use external data without copyright issues?
- `Confirmed` Speaker says metadata such as title, year, genre, director/cast is usually easier to work with than protected media assets.
- `Confirmed` Posters, trailers, and media assets are much more sensitive.
- `Confirmed` Speaker suggests metadata alone can already be enough for a recommender MVP.
- `Uncertain` Legal interpretation by country in transcript is not formal legal guidance.

---

## What an Agent Should Reuse

- `Synthesized` Reuse this problem framing for product ideation:
  - recommendation = retrieval + ranking + business logic + personalization
- `Synthesized` Reuse this system framing for architecture drafts:
  - offline profile/embedding/index pipeline
  - online retrieval/ranking pipeline
- `Synthesized` Reuse this implementation framing for MVP scope:
  - event logging
  - user profile weighting
  - vector candidate retrieval
  - aggregation-based ranking/filtering/diversification
- `Synthesized` Reuse this judging framing when shaping deliverables:
  - creativity
  - technical integration
  - practical impact
  - presentation clarity

---

## Minimal Build Checklist

- `Confirmed` MongoDB is the primary database.
- `Confirmed` Vector Search usage is explicit.
- `Confirmed` Aggregation Pipeline usage is explicit.
- `Synthesized` At least one end-to-end recommendation flow exists.
- `Synthesized` User-profile logic is explainable.
- `Synthesized` Cold-start strategy exists.
- `Synthesized` Ranking logic includes at least one business rule or post-retrieval tuning step.
- `Synthesized` Technical document explains system architecture and data schema clearly.

---

## Confidence / Limit Notes

- `Confirmed` Strongest-signal sections:
  - program context
  - workshop scope
  - submission checklist
  - recommendation-system mental model
  - user-profile weighting
  - collaborative-filtering flow
  - cold-start guidance
  - aggregation-based tuning
- `Uncertain` Weakest-signal sections:
  - exact proprietary model names
  - exact dimensions/pricing
  - exact slide labels for every architecture layer
  - detailed legal interpretation
- `Synthesized` Safe usage rule:
  - use this file for direction, architecture, product logic, and hackathon framing
  - verify noisy vendor/model/legal details before hard-coding or externally citing them
