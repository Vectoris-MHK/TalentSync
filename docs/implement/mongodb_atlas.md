### MongoDB Atlas Infrastructure & Vector Search Deployment Report

**Project Status:** LIVE & QUERYABLE

**Target Region:** AWS Singapore (`ap-southeast-1`)

**Deployment Infrastructure:** Dedicated M10 Cluster Tier

---

#### I. Infrastructure Provisioning & ClickOps Timeline

##### Step 1: Cluster Allocation & Identity Verification

* **Action Execution:** Initiated the deployment within a clean, unprovisioned project scope. Upgraded the default runtime specification from a shared instance model to a dedicated cluster layout to ensure resource isolation.
* **Billing Authentication:** Completed the administrative address registration and coupled a validated PayPal payment profile to the tenant structure. This routing successfully established required platform identification metrics while safely bounding all active billing against the **$50 hackathon project credit** pool, preventing live credit card transactions during runtime.
* **Hardware Profile:** Fully provisioned the cluster on **AWS Singapore (`ap-southeast-1`)** to fulfill localized latency requirements. The engine cluster name is permanently registered as `TalentSyncDB` running MongoDB version 8.0.

##### Step 2: Access Management & Network Routing (Security Quickstart)

* **Administrative Authorization:** Created an internal database administrative identity under the exact string name `talentsync_admin`. The system password credential was securely provisioned to prevent unauthorized environment intrusion.
* **Ingress Firewall Protocol:** Injected a global network access policy pointing to CIDR block `0.0.0.0/0` (Allow All). This explicit override allows the local development environment and downstream automated software layers to maintain uninterrupted persistent database connectivity despite dynamic client WAN IP changes during the project lifecycle.

---

#### II. Vector Search Topology & Schema Architecture

The workspace instance has successfully integrated search capabilities natively on the database nodes. The specialized vector index is active across all replica nodes.

##### 1. Index Definition Property Mapping

* **Data Strategy:** Configured via the **"Bring your own embeddings"** blueprint. The backend code engine manages document serialization and externally processes raw text into float matrices using a 200–500 token window per document section before triggering database writes.
* **Atlas Lucene Schema Configuration:**
```json
{
    "fields": [
        {
            "type": "vector",
            "path": "embedding",
            "numDimensions": 3072,
            "similarity": "cosine"
        }
    ]
}

```

##### 2. Core Constraints Decoded
* `path: "embedding"`: Direct index target pointing to the dense array field housing raw floats inside documents under the `jobs` collection.
* `numDimensions: 3072`: Explicit spatial dimension mapping configured to mirror high-density deep-learning vector models (such as OpenAI's `text-embedding-3-large`).
* `similarity: "cosine"`: Locks the similarity math to Angular Cosine Distance. This ensures accurate semantic matching for multi-language token data (such as Vietnamese phrasing) by focusing exclusively on structural context while eliminating mathematical variance introduced by differing document lengths.

---

#### III. Query Execution Mechanics & System Limits

##### 1. Runtime Array Processing
The indexing tier relies on native Atlas **Scalar Quantization** by default. This compression profile targets high-precision numbers to yield up to a **4x reduction in active memory (RAM) allocation**, maintaining smooth runtime operations while preserving **95% to 98% search accuracy**.

##### 2. Standard Search Execution Flow
To query this cluster structure, client application logic must process plain text using the following sequential steps:
1. **Vector Conversion Stage:** Route raw string inputs through the runtime embedding function to retrieve a dense array of 3072 float vectors.
2. **Aggregation Stage Ingestion:** Supply the computed float array straight into the target `$vectorSearch` database pipeline object block:
   ```javascript
{
  "$vectorSearch": {
    "index": "idx_jobs_vector",
    "path": "embedding",
    "queryVector": [ /* 3072 Float Array */ ],
    "numCandidates": 100,
    "limit": 3
  }
}

```

##### 3. Automated Agent Execution Constraints

* **The Structural Dimension Lock:** The Lucene storage framework physically binds index definitions to the `numDimensions` configuration value (3072). If the application layer alters its target model dimensions (e.g., swapping to a 1536-dimensional matrix), **in-place index adjustments are impossible**. Software layers must populate a new document field and build a completely fresh index target instance (e.g., `idx_jobs_vector_v2`) to prevent runtime failure.
* **Candidate Resource Optimization (`numCandidates`):** This property configures the initial sample depth scanned by the vector engine before calculating the final ranking. Restricting this setting too tightly optimizes for raw performance but causes semantic missing errors. Extending the parameter too high ($>10,000$) introduces severe latency penalties. For the current dataset scope, an allocation between **100 and 1000** maintains the ideal precision-to-speed balance.
* **Pre-Filter Injection Patterns:** Always include metadata filters directly inside the `$vectorSearch.filter` sub-block rather than chaining an individual `$match` process downstream in the database query. Atlas resolves filter arguments directly at the Lucene level, shedding irrelevant data **prior** to executing heavy K-Nearest Neighbor (KNN) float processing calculations.
* **Network Caching Requirements:** External vector conversions introduce a recurring latency cost ($50\text{ms} - 200\text{ms}$ per round trip). Software architectures should use local caching layers for repetitive query strings to decrease processing overhead and protect external API consumption credits from draining.

---

#### IV. Production Environment Properties

All application connection scripts must reference the production target database using the structural keys configured during deployment:

```ini
# Core Storage Targets
MONGODB_DB_NAME=job-portal
MONGODB_COLLECTION_NAME=jobs
MONGODB_VECTOR_INDEX_NAME=idx_jobs_vector

```

*(Note: Secure credential details, cluster endpoints, and specific password values must be provided exclusively via local, non-committed deployment environments or automated secret managers inside the runtime stack).*