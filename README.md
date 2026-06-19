#  CV Analyser

An instant, AI-powered CV analysis tool built with React, Vite, and Express. Upload any CV and get a full breakdown of skills, experience, education, a career score, and suggested job roles — all processed locally with no external API required.

![Smartiff CV Analyser](https://img.shields.io/badge/Status-Live-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![Node](https://img.shields.io/badge/Node-20%2B-green) ![React](https://img.shields.io/badge/React-18-61dafb)

---

## Features

- **Upload or paste your CV** — supports PDF, TXT, DOC, and DOCX formats
- **Instant analysis** — no external API, no API key, fully self-contained
- **Overall career score** (0–100) based on skills, experience, and content quality
- **Skills extraction** — technical tools, soft skills, and spoken languages
- **Work experience timeline** — roles, companies, dates, and highlights
- **Education** — degrees, institutions, and graduation years
- **Strengths & improvement areas** — specific, actionable feedback
- **Job role suggestions** — matched roles with a fit percentage and reasoning
- **Recommendations** — tailored tips to improve the CV
- **Save report** — print or save the results as a PDF

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| File parsing | pdf-parse, multer |
| Analysis engine | Custom rule-based NLP (no external API) |
| Dev tooling | tsx, concurrently |

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/smartiff-cv-analyser.git
cd smartiff-cv-analyser
```

2. Install dependencies for the root, client, and server:

```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

3. Start the development server:

```bash
npm run dev
```

This starts both the frontend and backend using `concurrently`:

- Frontend: [http://localhost:5000](http://localhost:5000)
- Backend API: [http://localhost:3001](http://localhost:3001)

---

## Project Structure

```
smartiff-cv-analyser/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── UploadPage.tsx     # CV upload interface
│   │   │   └── ResultsPage.tsx    # Analysis results display
│   │   ├── lib/
│   │   │   └── utils.ts           # Utility functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
│
├── server/                  # Express backend
│   ├── src/
│   │   ├── index.ts               # Express server & API routes
│   │   ├── analyse.ts             # CV analysis engine
│   │   └── types.ts               # Shared TypeScript types
│   └── package.json
│
└── package.json             # Root scripts (runs both with concurrently)
```

---

## API

### `POST /api/analyse`

Accepts a multipart form upload with a CV file and returns a full analysis result.

**Request:** `multipart/form-data` with field `cv` (PDF, TXT, DOC, DOCX — max 10 MB)

**Response:**

```json
{
  "overallScore": 78,
  "summary": "A strong candidate with 6 years of experience...",
  "strengths": ["..."],
  "improvements": ["..."],
  "skills": {
    "technical": ["React", "TypeScript", "Node.js"],
    "soft": ["Leadership", "Communication"],
    "languages": ["English", "French"]
  },
  "experience": {
    "totalYears": 6,
    "roles": [
      {
        "title": "Senior Software Engineer",
        "company": "Acme Corp",
        "duration": "2021–Present",
        "highlights": ["Led a team of 5 engineers", "Reduced load time by 40%"]
      }
    ]
  },
  "education": [
    {
      "degree": "BSc Computer Science",
      "institution": "University of London",
      "year": "2018"
    }
  ],
  "recommendations": ["..."],
  "jobMatches": [
    { "title": "Full Stack Developer", "match": 88, "reason": "Matched skills: React, Node.js, TypeScript" }
  ]
}
```

### `GET /api/health`

Returns `{ "status": "ok" }` — used to verify the server is running.

---

## How the Analysis Works

The CV analysis engine (`server/src/analyse.ts`) works entirely offline:

1. **Text extraction** — reads raw text from the uploaded file (PDF via `pdf-parse`, plain text directly)
2. **Skill matching** — scans against a curated list of 100+ technical skills, soft skills, and languages
3. **Experience detection** — identifies date ranges, job titles, companies, and bullet highlights using regex patterns
4. **Education parsing** — detects degree keywords, institution names, and graduation years
5. **Scoring** — calculates a score from skills breadth, years of experience, education level, and content richness
6. **Job matching** — maps detected skills to a set of common job roles and calculates a fit percentage

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:client` | Start only the frontend (Vite on port 5000) |
| `npm run dev:server` | Start only the backend (Express on port 3001) |
| `npm run build` | Build the frontend for production |

---

## Supported File Formats

| Format | Support |
|---|---|
| `.txt` | Full support |
| `.pdf` | Full support (text-based PDFs) |
| `.doc` / `.docx` | Partial (text extracted where possible) |

> For best results, use a text-based PDF or plain TXT file. Scanned/image PDFs cannot be parsed.

---

## License

MIT — free to use, modify, and distribute.
