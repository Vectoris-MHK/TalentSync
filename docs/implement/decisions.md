# Technical Decisions & Trade-offs

## Embedding Model

> **Constraint:** Project is a Vietnamese job matching platform. Source code is currently English (template), but actual content (job descriptions, user profiles, behavior data) will be primarily Vietnamese.

| Option | Dimensions | $/1M tokens | Vietnamese | Notes |
|---|---|---|---|---|
| `voyage-3-lite` | 1024 | ~$0.02 | ❌ Poor | English-optimized only |
| `voyage-multilingual-2` | 1024 | ~$0.06 | ✅ Good | Multilingual, Vietnamese included |
| OpenAI `text-embedding-3-small` | 1536 | $0.02/1M | ✅ Good | Cheaper alternative, smaller dimensions |
| **OpenAI `text-embedding-3-large`** ⭐ | 3072 | $0.13/1M | ✅ Excellent | Highest quality, best Vietnamese semantic capture |

**Decision:** `text-embedding-3-large` (3072d, cosine). Rationale:
- **Vietnamese support is mandatory** — model must capture Vietnamese semantics accurately. OpenAI embeddings consistently rank highest in multilingual benchmarks.
- 3072 dimensions provides highest precision for semantic matching of Vietnamese job descriptions and user behavior.
- $0.13/1M tokens — ~$1.30 total for 30 jobs + 100 events, well within hackathon budget.
- Direct OpenAI API integration — no additional vendor registration needed (project likely already has OpenAI key).

## Similarity Metric

| Metric | Speed | Use Case |
|---|---|---|
| **cosine** ⭐ | Medium | Safe default, ignores magnitude, cares about direction |
| dotProduct | Fastest | When magnitude matters (e.g. rating scores) |
| euclidean | Slowest | When absolute distance matters |

**Decision:** `cosine`. Workshop explicitly recommends this as safest default. Job descriptions vary in length → direction matters more than magnitude.

## numCandidates

| Value | Trade-off |
|---|---|
| 50 | Cheap, fast, may miss relevant results |
| **200** ⭐ | Reasonable balance for free tier |
| 500+ | High recall, more compute, may not be available on M0/M10 |

**Decision:** Start at 200. Final limit is 20, so 10x candidate pool gives reasonable recall. Tune after testing with real data.

## Scoring Weights

| Factor | Weight | Rationale |
|---|---|---|
| vectorScore | 0.60 | Semantic relevance is primary signal |
| recencyBoost | 0.20 | Fresh jobs matter (30-day decay) |
| skillMatch | 0.15 | Explicit category match |
| salaryMatch | 0.05 | Minor factor |

Recency formula: `exp(-(now - date) / (30 * 86400000))` → 1.0 today, ~0.37 at 30 days, ~0.14 at 60 days.

## Recommendation Blend Ratio

When user has profile embedding:
- **70% content-based** (vector search with user embedding)
- **30% collaborative** (items liked by similar users)

Cold start (new user, no profile):
1. Onboarding preferences → category filter + recency sort
2. Fallback: popular jobs (most applications in last 30 days)

## Chunking Strategy

Job descriptions are usually 200-2000 words → do NOT need chunking for hackathon MVP. Single document embedding per job is sufficient since:
- Job descriptions are relatively short
- Complexity of chunking + merging not worth it for demo
- If descriptions exceed 8000 tokens (rare), truncate to first 5000 characters

## Query Embedding Cache

Not implementing for MVP — only ~20 unique users expected in demo. If scaling:
- Use in-memory Map with TTL for query text → embedding
- Typical job titles ("React Developer", "UX Designer") repeat often

## OpenAI API Fallback Strategy

**If API is unavailable or rate-limited during request:**
1. **Embedding generation failure → degrade to text-based fallback:**
   - If `generateEmbedding()` throws → catch error, return `null`
   - On job creation: save job without embedding (batch retry later via `seedEmbeddings.js`)
   - On `recommend-content` query: if query embedding fails → fallback to text-based `$text` search or regex `$match`
   - On `recommend-feed`: if user has no embedding → treat as cold start (preferences → popular)

2. **Retry logic for batch processing (`seedEmbeddings.js`):**
   - Exponential backoff: 1s → 2s → 4s → 8s (max 3 retries per batch)
   - Log failed job IDs to `scripts/failed_embeddings.json` for manual retry
   - Batch size: 25 (not 50) when rate limiting is detected

3. **Budget safety:**
   - `text-embedding-3-large` at $0.13/1M tokens — with 30 jobs × ~500 chars each ≈ 15K tokens ≈ $0.002
   - Add `MAX_EMBEDDING_COST=1.00` env var — stop if estimated cost exceeds this
   - Track usage via `openai.usage` in response metadata

## Compression (Scalar Quantization)

Not implementing for MVP. If needed:
- Atlas scalar quantization: ~4x RAM savings, 95-98% quality retention
- Enable in Atlas index config: `"quantization": "scalar"`
- Only beneficial with 1000+ jobs

## Index Migration Strategy

If switching model later (e.g. from `text-embedding-3-large` to `text-embedding-3-small`):
1. Dimensions change from 3072 to 1536 → create `embedding_v2` + `vector_index_v2`
2. Run side-by-side evaluation
3. Cut over after validation
4. Delete legacy field + index

## Behavioral Event Weights

| Event | Weight | Rationale |
|---|---|---|
| search | 4 | Explicit intent — user tells system what they want. Captured from search bar query text. Critical for cold start and interest profiling |
| view | 1 | Lowest signal — user may just browse |
| bookmark | 3 | Medium signal — shows intent |
| apply | 5 | Highest signal — user committed |

## Dual Profile (Short-term vs Long-term)

Not implementing for MVP complexity reasons. If extended:
- Short-term profile: last 7 days of events
- Long-term profile: all events, aged weights
- Blend with rank fusion (reciprocal rank fusion)

## HTML Strip Strategy

Job descriptions are HTML from Quill editor. Before embedding:
1. `stripHtml(description)` → removes all HTML tags
2. Combine: `title + ". " + category + ". " + level + ". " + strippedDescription`
3. Truncate to ~7000 characters if needed (3072d model has larger context window, but job descriptions are typically short)

## Why Not a Separate Vector DB?

Workshop explicitly emphasizes MongoDB advantage: operational data + vector search in one database.
- No dual-database sync complexity
- No CDC/event/worker pipeline needed
- Aggregation Pipeline naturally joins operational + vector data
- Simpler architecture for hackathon submission

## Model References from Workshop 1

Per workshop speaker, key tuning knobs (confirmed from source):
- Model selection → quality/cost trade-off
- Dimension count → storage/compute vs accuracy
- Similarity metric → cosine safest default
- Compression/quantization → 4x RAM savings with scalar quantization
- `numCandidates` → major speed/quality trade-off
- Business filters → always pair vectors with filters
- Chunk size → smaller chunks reduce embedding waste

## Model References from Workshop 2

Per workshop speaker, recommendation system layers (confirmed from source):
- 8 layers split into 2 groups: offline/batch + online/request-time
- Offline: ingestion, embedding generation, vector index, precomputed user profile
- Online: cache, candidate retrieval, join/enrich/filter/rerank, final ranked list
- Collaborative filtering: find user's items → find similar users → collect their items → score/rank
- Cold start: onboarding wizard first, signup metadata second, coarse demographic fallback last
- Diversity: pure nearest-result ranking over-concentrates → use aggregation to diversify
