# Requirements Document

## Introduction

CV-based Recommendation is a P0 extension to TalentSync's existing recommendation engine. It allows authenticated users to upload a CV file (PDF, DOCX, or image), extract the text content, generate a vector embedding, and run a MongoDB `$vectorSearch` aggregation pipeline to return a ranked list of matching jobs. The feature covers both the backend API (N1–N4) and the frontend page (N5), as defined in CPM.md and WBS.md section 4.5 and 6.1.x.

## Glossary

- **CV**: Curriculum Vitae — a document uploaded by the user containing their work experience, skills, and education.
- **CV Extraction Service**: `server/services/cvExtractionService.js` — extracts raw text from PDF, DOCX, or image files.
- **Embedding**: A 3072-dimensional float vector produced by OpenAI `text-embedding-3-large` representing semantic content.
- **embeddingService**: `server/services/embeddingService.js` — existing service that calls OpenAI to generate embeddings.
- **idx_jobs_vector**: The existing Atlas Vector Search index on the `jobs` collection (3072d, cosine similarity).
- **Recommendation Log**: A document in the `recommendation_logs` MongoDB collection recording each CV recommendation request.
- **CVRecommendationPage**: The React page at route `/cv-recommend` where users upload their CV and view results.
- **requireAuth**: Clerk middleware (`requireAuth()` from `@clerk/express`) that validates the Bearer token and populates `req.auth.userId`.
- **multer**: Node.js middleware for handling `multipart/form-data` file uploads.
- **matchReasons**: A rule-based array of keywords found in both the CV text and a job's title/description.
- **finalScore**: Composite score = `vectorScore × 0.7 + recencyBoost × 0.3`.
- **vectorScore**: Cosine similarity score returned by `$vectorSearch` via `{ $meta: "vectorSearchScore" }`.
- **recencyBoost**: Exponential decay score based on job posting date within a 30-day window.
- **User**: MongoDB document in the `users` collection, model at `server/models/User.js`.
- **TalentSync**: The job portal application being built for MongoHack 2026.

---

## Requirements

### Requirement 1 — CV Upload Endpoint

**User Story:** As an authenticated job seeker, I want to upload my CV file to the server, so that TalentSync can extract its content and find matching jobs.

#### Acceptance Criteria

1. WHEN an authenticated user sends a `POST /api/recommendations/from-cv` request with a valid file, THE System SHALL accept files of type PDF, DOCX, PNG, JPG, and JPEG with a maximum size of 10 MB.
2. IF the uploaded file's MIME type is not one of `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `image/png`, `image/jpeg`, THEN THE System SHALL return HTTP 400 with `{ success: false, message: "Unsupported file type" }`.
3. IF the uploaded file exceeds 10 MB, THEN THE System SHALL return HTTP 400 with `{ success: false, message: "File too large. Maximum size is 10MB" }`.
4. WHEN a request arrives without a valid Clerk Bearer token, THE System SHALL return HTTP 401 before processing the file.
5. THE System SHALL mount the recommendation route at `/api/recommendations` in `server/server.js`.

---

### Requirement 2 — CV Text Extraction

**User Story:** As a job seeker, I want my CV content to be read regardless of file format, so that the system can understand my skills even if I upload a scanned image.

#### Acceptance Criteria

1. WHEN the uploaded file is a PDF, THE System SHALL extract raw text using `pdf-parse` and return `{ text, wordCount, extractionMethod: "pdf-parse" }`.
2. WHEN the uploaded file is a DOCX, THE System SHALL extract raw text using `mammoth` and return `{ text, wordCount, extractionMethod: "mammoth" }`.
3. WHEN the uploaded file is a PNG, JPG, or JPEG, THE System SHALL extract text using `tesseract.js` OCR and return `{ text, wordCount, extractionMethod: "tesseract" }`.
4. IF a PDF extraction produces fewer than 100 characters of text, THEN THE System SHALL retry extraction using `tesseract.js` OCR on the same file buffer.
5. IF the extracted text contains fewer than 50 words after all extraction attempts, THEN THE System SHALL return HTTP 422 with `{ success: false, message: "CV text too short to analyze. Please upload a more complete CV." }`.

---

### Requirement 3 — CV Embedding and Vector Search

**User Story:** As a job seeker, I want the system to semantically match my CV against all available jobs, so that I receive the most relevant job recommendations.

#### Acceptance Criteria

1. WHEN CV text extraction succeeds, THE System SHALL call `embeddingService.generateEmbedding(cvText)` to produce a 3072-dimensional vector.
2. THE System SHALL execute a `$vectorSearch` aggregation pipeline on the `jobs` collection using `idx_jobs_vector` with `numCandidates: 200` and `limit: 50`.
3. WHILE executing the aggregation pipeline, THE System SHALL apply `$match { visible: true }` and optional `location`, `level`, `category` filters passed as query parameters.
4. THE System SHALL compute `finalScore = vectorScore × 0.7 + recencyBoost × 0.3` for each candidate job, where `recencyBoost` uses a 30-day exponential decay on `job.date`.
5. THE System SHALL return the top 20 jobs sorted by `finalScore` descending, excluding the `embedding` field from the response.

---

### Requirement 4 — Match Reasons and Recommendation Log

**User Story:** As a job seeker, I want to see why each job was recommended, so that I can quickly assess relevance without reading the full description.

#### Acceptance Criteria

1. THE System SHALL compute `matchReasons` for each returned job by finding keywords that appear in both the CV text and the job's `title` + `description` fields, returning up to 5 keywords.
2. WHEN a CV recommendation request completes successfully, THE System SHALL insert one document into the `recommendation_logs` collection containing `userId`, `cvFileName`, `cvTextPreview` (first 500 characters), `embeddingModel: "text-embedding-3-large"`, `filters`, `recommendedJobs[{ jobId, similarityScore, finalScore }]`, and `createdAt`.
3. THE System SHALL extend the `User` schema in `server/models/User.js` with `cvFileName: String`, `cvUploadedAt: Date`, and `cvTextPreview: String` fields.
4. THE System SHALL create a `RecommendationLog` Mongoose model at `server/models/RecommendationLog.js`.
5. THE System SHALL update the `User` document with `cvFileName`, `cvUploadedAt`, and `cvTextPreview` after each successful CV recommendation request.

---

### Requirement 5 — CV Recommendation Frontend Page

**User Story:** As an authenticated job seeker, I want a dedicated page to upload my CV and view recommended jobs, so that I can find relevant opportunities based on my full professional profile.

#### Acceptance Criteria

1. THE System SHALL render a `CVRecommendationPage` component at route `/cv-recommend` registered in `client/src/App.jsx`.
2. WHEN an unauthenticated user navigates to `/cv-recommend`, THE System SHALL redirect the user to the Clerk sign-in flow.
3. THE System SHALL render a drag-and-drop upload area that accepts PDF, DOCX, PNG, JPG, and JPEG files up to 10 MB, validates file type and size client-side before submission, and displays the selected file name and size.
4. THE System SHALL render optional filter controls for `location`, `level`, and `category` reusing the existing `JobCategories` and `JobLocations` data from `client/src/assets/assets.js`.
5. WHEN the user submits a CV, THE System SHALL display four sequential loading states: "Đang tải CV lên...", "Đang đọc nội dung CV...", "Đang phân tích kỹ năng...", "Đang tìm việc làm phù hợp...".
6. WHEN the API returns results, THE System SHALL display each job with title, company name and logo, location, salary, `finalScore` as a percentage, `matchReasons` as badges, and buttons linking to `/apply-job/:id`.
7. IF the API returns an error or zero results, THE System SHALL display a Vietnamese-language error message appropriate to the error type.
