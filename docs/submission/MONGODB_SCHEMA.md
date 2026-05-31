# MongoDB Schema: TalentSync

Database name: `job-portal`

Connection is configured in `server/config/db.js`:

```js
mongoose.connect(`${process.env.MONGODB_URI}/job-portal`)
```

Mongoose will automatically create collections when data is first inserted. You do not need to manually create collections in MongoDB Atlas unless you want to seed data.

## 1. `users`

Source file: `server/models/User.js`

Purpose: stores applicant profile data synchronized from Clerk.

```js
{
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  resume: {
    type: String
  },
  image: {
    type: String,
    required: true
  }
}
```

Example document:

```json
{
  "_id": "user_2abc123",
  "name": "Nguyen Van A",
  "email": "nguyenvana@example.com",
  "resume": "https://res.cloudinary.com/demo/resume.pdf",
  "image": "https://img.clerk.com/avatar.png"
}
```

Notes:

- `_id` is the Clerk user ID.
- `resume` stores the Cloudinary URL after the applicant uploads a resume.
- `email` must be unique.

## 2. `companies`

Source file: `server/models/Company.js`

Purpose: stores recruiter/company accounts.

```js
{
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  image: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
}
```

Example document:

```json
{
  "_id": "665abc1234567890abcdef12",
  "name": "TalentSync Company",
  "email": "hr@talentsync.com",
  "image": "https://res.cloudinary.com/demo/company-logo.png",
  "password": "$2b$10$hashedPasswordValue"
}
```

Notes:

- `password` is stored as a bcrypt hash.
- `image` stores the uploaded company logo URL from Cloudinary.
- `email` must be unique.

## 3. `jobs`

Source file: `server/models/Job.js`

Purpose: stores job posts created by companies.

```js
{
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  level: {
    type: String,
    required: true
  },
  salary: {
    type: Number,
    required: true
  },
  embedding: {
    type: [Number],
    default: []
  },
  date: {
    type: Number,
    required: true
  },
  visible: {
    type: Boolean,
    default: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  }
}
```

Example document:

```json
{
  "_id": "665def1234567890abcdef34",
  "title": "Frontend Developer",
  "description": "<p>Build React user interfaces.</p>",
  "location": "Remote",
  "category": "Programming",
  "level": "Junior Level",
  "salary": 80000,
  "embedding": [],
  "date": 1716000000000,
  "visible": true,
  "companyId": "665abc1234567890abcdef12"
}
```

Notes:

- `description` is rich HTML content from the Quill editor.
- `embedding` stores the vector representation used by MongoDB Atlas Vector Search. Seed/crawled data can use an empty array until embeddings are generated.
- `date` is stored as a number from `Date.now()`.
- `visible: false` hides the job from public job listings.
- `companyId` references a document in `companies`.

## 4. `jobapplications`

Source file: `server/models/JobApplication.js`

Purpose: stores applications submitted by applicants for jobs.

```js
{
  userId: {
    type: String,
    required: true,
    ref: "User"
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Company"
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Job"
  },
  status: {
    type: String,
    required: true,
    default: "pending"
  },
  date: {
    type: Number,
    required: true
  }
}
```

Example document:

```json
{
  "_id": "665fff1234567890abcdef56",
  "userId": "user_2abc123",
  "companyId": "665abc1234567890abcdef12",
  "jobId": "665def1234567890abcdef34",
  "status": "pending",
  "date": 1716000000000
}
```

Notes:

- `userId` references `users._id`, which is a Clerk user ID string.
- `companyId` references `companies._id`.
- `jobId` references `jobs._id`.
- Current statuses used by the app:
  - `pending`
  - `Accepted`
  - `Rejected`

## Relationship Summary

```text
companies 1 ---- many jobs
users     1 ---- many jobapplications
companies 1 ---- many jobapplications
jobs      1 ---- many jobapplications
```

## Required Environment Variable

Server `.env` must include:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
```

The app appends `/job-portal` automatically, so do not include `/job-portal` at the end unless you also update `server/config/db.js`.
