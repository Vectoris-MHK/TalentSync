# Workshop 1 Context Master — MongoDB Vector Search & Similarity Search

## Program Context

- Source files read:
  - `docs/hackathon/intro/Mongo Hackathon 2026.md`
  - `docs/hackathon/mails/Workshop Buổi 1 - MongoDB Vector Search.md`
  - `docs/hackathon/workshop/workshop1 transcript.md`
- Program context:
  - Mongo Hackathon 2026
  - Main challenge theme: Recommendation Engine
  - Recommended MongoDB capabilities from program material:
    - Vector Search
    - Aggregation Pipeline
- Workshop 1 stated topic:
  - MongoDB Vector Search
  - Similarity Search
  - Embedding generation/storage
  - `$vectorSearch`
  - Q&A
- Intended role of this file:
  - single-file source of truth for future agents
  - optimized for prompting, planning, architecture, implementation support
  - not optimized for presentation prose

## Hard Constraints / Requirements

- Language target:
  - English-first
  - retain original-language wording only when source meaning is unstable without it
- Source policy:
  - Preserve source meaning
  - Do not add external knowledge
  - Do not silently upgrade vague source claims into hard facts
- Confidence policy:
  - `Confirmed` = explicit in source
  - `Synthesized` = merged across multiple source segments, still faithful
  - `Uncertain` = noisy/ambiguous; recheck before operational use
- File policy:
  - single file only
  - no split layers
  - compact, canonical terminology
- Agent interpretation policy:
  - prefer technical stability over human readability
  - treat transcript noise as evidence quality issue, not license to invent missing detail

## Why This Matters

- `Confirmed` Hackathon scope includes recommendation use cases → Vector Search is directly relevant to project direction.
- `Confirmed` Workshop content covers embeddings, indexing, and query flow → enough to inform MVP architecture.
- `Synthesized` Document is useful for:
  - semantic retrieval design
  - similar-item search design
  - recommendation cold-start design
  - candidate/profile/content matching patterns
- `Synthesized` Main value is not syntax alone → it is decision logic around trade-offs, tuning, and operational simplicity.

## Core Mental Model

- `Confirmed` Similarity search is semantic retrieval, not exact keyword matching.
- `Confirmed` Retrieval requires both sides in vector space:
  - stored data -> embedding vectors
  - user query -> query vector
- `Synthesized` Basic system model:
  - raw business data exists first
  - embeddings are derived data
  - vector index enables retrieval
  - query is embedded at runtime
  - `$vectorSearch` ranks semantically close results
- `Confirmed` Search quality depends on several coupled decisions:
  - embedding model
  - dimension count
  - similarity metric
  - compression/quantization
  - `numCandidates`
  - filtering strategy
- `Synthesized` Practical rule:
  - syntax is easy
  - tuning is the real work

## Agent Operating Guidance

- When using this workshop for downstream tasks:
  - assume this file is the primary workshop truth layer
  - use transcript only when this file marks an area `Uncertain` or when finer wording matters
- When making plans:
  - treat Vector Search as an architecture choice with cost/latency/quality consequences
  - do not reduce it to a single query operator decision
- When proposing implementations:
  - include embedding generation path
  - include query embedding path
  - include index definition
  - include filter strategy
  - include tuning knobs
- When writing architecture docs:
  - separate operational data from derived embedding data conceptually, even if stored in same database ecosystem
- When evaluating options:
  - prefer explicit trade-off framing
  - avoid claims like “best model” or “best metric” without workload evidence
- When using source claims operationally:
  - any tier/deployment/rank-fusion availability claim from noisy transcript sections must be treated as `Uncertain`

## End-to-End Architecture / Flow

- `Confirmed` High-level flow described in workshop:
  1. start with business documents
  2. choose embedding model
  3. generate embeddings for document fields
  4. store embeddings in MongoDB
  5. create vector index
  6. receive user query
  7. generate query embedding
  8. call aggregation with `$vectorSearch`
  9. return top results
- `Synthesized` Minimal operational flow:
  - document fields such as `title`, `description` exist
  - embedding field is added
  - query text is embedded using compatible model space
  - retrieval returns nearest candidates
- `Confirmed` Search stage parameters called out in source:
  - `index`
  - `path`
  - `queryVector`
  - `numCandidates`
  - `limit`
- `Confirmed` Meaning of `numCandidates`:
  - low value -> faster, cheaper, higher miss risk
  - high value -> slower, more compute, higher recall/quality potential
- `Confirmed` Meaning of `limit`:
  - final result count returned to client
  - not the same as candidate scan count

## Data Model Signals

- `Confirmed` Example schema pattern from workshop:
  - business fields like `title`, `description`
  - derived field like `embedding`
- `Synthesized` Canonical document pattern:

```json
{
  "title": "...",
  "description": "...",
  "embedding": [0.123, -0.456, 0.789]
}
```

- `Confirmed` Constraint:
  - vector index is tied to declared dimension count
- `Confirmed` Consequence:
  - changing to a model with different dimensions is not a trivial in-place index edit
- `Synthesized` Versioning implication:
  - future-safe naming should anticipate alternate embedding fields and alternate index versions

## Key Strategies / Decision Logic

### Model Selection

- `Confirmed` Multiple model providers/options were mentioned.
- `Synthesized` Selection inputs:
  - use case
  - query pattern
  - language requirements
  - cost tolerance
  - latency tolerance
- `Confirmed` Dimension guidance from workshop:
  - `1536` -> common, practical
  - `3072` -> potentially higher accuracy, higher cost
  - lower dimensions such as `1024` -> may fit chatbot/multilingual situations
- `Synthesized` Action rule:
  - do not assume larger dimension is automatically better
  - choose against real workload, not benchmark prestige

### Metric Selection

- `Confirmed` Metrics mentioned:
  - `cosine`
  - `dotProduct`
  - distance/euclidean-style measurement
- `Confirmed` Speaker framing:
  - `cosine` -> safest general default
  - `dotProduct` -> fastest
  - distance/euclidean style -> useful when distance interpretation matters
- `Synthesized` Action rule:
  - if no clear workload signal exists, start with `cosine`

### Filtering Strategy

- `Confirmed` Pure vector-only search is usually not enough in real systems.
- `Confirmed` Source examples imply filters like:
  - brand
  - category
  - price
  - organizational scope
- `Synthesized` Action rule:
  - always look for business filters before tuning semantic retrieval alone
- `Synthesized` Consequence:
  - better precision
  - lower useless candidate set
  - stronger business-context relevance

### Chunking Strategy

- `Confirmed` Long text should not always be embedded as one large block.
- `Confirmed` Source suggests chunking around a few hundred tokens.
- `Synthesized` Implication:
  - chunking improves cost control and retrieval granularity

### Query Embedding Cache

- `Confirmed` Query embeddings can repeat.
- `Confirmed` Recomputing them costs time and money.
- `Synthesized` Action rule:
  - if query repetition exists, add caching early

### Versioning / Migration Strategy

- `Confirmed` Production teams may want to test newer models over time.
- `Confirmed` Dimension changes break trivial index reuse.
- `Synthesized` Recommended migration pattern from source logic:
  - create `embedding_v2`
  - create `vector_index_v2`
  - run side-by-side evaluation
  - cut over after validation
  - remove legacy path later

## Trade-offs / Tuning Points

### Embedding Model

- `Confirmed` Better model quality can cost more.
- `Synthesized` Tune against:
  - semantic quality
  - language fit
  - token/storage/compute cost

### Dimension Count

- `Confirmed` More dimensions can improve quality but increase cost.
- `Synthesized` Consequence:
  - storage grows
  - compute grows
  - model cost may grow

### Similarity Metric

- `Confirmed` Metric choice changes retrieval behavior.
- `Synthesized` Consequence:
  - speed/quality behavior changes by workload

### Compression / Quantization

- `Confirmed` Compression reduces resource cost.
- `Confirmed` Scalar quantization was described as roughly `4x` RAM savings with quality retention around `95%–98%` in many cases.
- `Confirmed` More aggressive compression exists but reduces accuracy more.
- `Synthesized` Consequence:
  - compression is a controllable accuracy-cost knob

### `numCandidates`

- `Confirmed` Major speed/quality trade-off parameter.
- `Synthesized` Consequence:
  - must be benchmarked, not guessed

### Filter Strength

- `Synthesized` Stronger filters can improve business relevance.
- `Synthesized` Over-filtering can suppress useful recall.

### Chunk Size

- `Confirmed` Smaller chunks can reduce embedding waste.
- `Synthesized` Chunk size also changes retrieval granularity and context retention.

## Distilled Q&A

### Q1. What happens if the team changes embedding model or vector dimension?

- `Confirmed` Existing index cannot be lightly edited when dimension changes.
- `Synthesized` Recommended response:
  - create new embedding field
  - create new index version
  - benchmark in parallel
  - deprecate old path after validation

### Q2. Is search index behavior equivalent to a normal MongoDB B-tree index?

- `Confirmed` No.
- `Confirmed` Speaker described a separate retrieval-optimized search/index layer, conceptually closer to Lucene/inverted-index behavior.
- `Synthesized` Consequence:
  - treat search as its own retrieval subsystem, not as a normal secondary index mental model

### Q3. Should agents recommend pure vector search with no filters?

- `Confirmed` Usually no.
- `Synthesized` Recommendation:
  - pair vector retrieval with business constraints whenever available

### Q4. Where should optimization effort focus first?

- `Confirmed` Relevant knobs from source:
  - model size
  - dimension
  - compression
  - `numCandidates`
  - query-embedding cache
  - chunk size

### Q5. What is MongoDB’s main practical advantage vs a separate vector DB stack?

- `Confirmed` Source framing:
  - operational data and vector/search workflow sit closer together
  - sync complexity is lower
- `Synthesized` Consequence:
  - fewer moving parts than event/CDC/worker-based dual-database sync

## Reusable Guidance for Future Agents

- Use this file when asked to:
  - design recommendation/search MVPs
  - explain Workshop 1 content
  - derive architecture notes from workshop material
  - justify MongoDB Vector Search usage in hackathon scope
- Reuse these canonical statements:
  - semantic search requires embedding both stored content and query
  - tuning matters more than syntax
  - business filters are first-class retrieval controls
  - model/dimension/metric/compression/`numCandidates` are coupled trade-off knobs
  - dimension changes imply index migration/versioning logic
- Reuse these canonical implementation checkpoints:
  - data fields selected for embedding
  - embedding generation path defined
  - query embedding path defined
  - vector index defined
  - `numCandidates` tuning plan defined
  - business filters defined
  - cache strategy considered
- Reuse these canonical MVP patterns:
  - similar product retrieval
  - content-based recommendation
  - semantic search bar
  - candidate/job/profile matching
- If asked for next-step execution guidance:
  - start with a small indexed dataset
  - implement one embedding model path
  - implement one query embedding path
  - benchmark with and without filters
  - tune `numCandidates`
  - only then consider model swaps or more advanced compression choices

## Confidence / Limit Notes

- `Confirmed` Strongest source areas:
  - vector-search mental model
  - need to embed both data and query
  - role of metrics
  - role of compression
  - role of `numCandidates`
  - need for filters
  - migration/versioning logic when dimensions change
- `Uncertain` Noisy source areas:
  - community vs free-tier vs dedicated-tier specifics
  - exact deployment availability boundaries
  - rank-fusion availability details
  - some proper names and terms in transcript ASR output
- `Synthesized` Safe handling rule:
  - use `Uncertain` sections for orientation only
  - recheck against primary source artifacts before making infrastructure commitments
- Source-quality note:
  - transcript is noisy and partially ASR-corrupted
  - this file intentionally normalizes repeated ideas and removes conversational redundancy
  - normalization preserves meaning but should not be mistaken for verbatim transcript

## Source Read Report

- Sources read:
  - `docs/hackathon/intro/Mongo Hackathon 2026.md`
  - `docs/hackathon/mails/Workshop Buổi 1 - MongoDB Vector Search.md`
  - `docs/hackathon/workshop/workshop1 transcript.md`
- File updated:
  - `docs/hackathon/workshop/workshop1.md`
- Temp files:
  - created: none
  - deleted: none
