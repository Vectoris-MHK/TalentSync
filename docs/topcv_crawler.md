# TopCV Job Crawler

This crawler creates a JSON seed dataset for the `jobs` collection and future MongoDB Atlas Vector Search indexing.

## Install

```bash
pip install -r scripts/requirements-crawler.txt
```

## Run

```bash
python scripts/crawl_topcv_jobs.py --pages 3 --output data/topcv_jobs.json
```

The generated documents include:

- `job_title` and `title`
- `description`: clean semantic text for embeddings
- `description_html`: sanitized rich text with only simple content tags
- `location`, `category`, `level`
- `salary`: numeric VND estimate for the current Mongoose schema
- `salary_text`: original salary label
- `embedding`: empty array placeholder, ready for the embedding pipeline
- `source`, `source_id`, `crawled_at`: crawl metadata for deduplication

TopCV may return Cloudflare or rate-limit pages to plain HTTP clients. The script detects those responses and logs a clear warning instead of writing noisy challenge HTML into the dataset.
