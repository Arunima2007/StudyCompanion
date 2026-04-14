# Flashr

Flashr is a full-stack AI-powered flashcard study app for students. Users can sign in with Google, organize subjects and chapters, upload lecture notes, generate flashcards with Gemini, review answers with AI feedback, and track study progress over time.

## Tech Stack

- `frontend/`: React, Vite, JavaScript, React Router, Tailwind CSS, Axios, React Query, Recharts
- `backend/`: Node.js, Express, Prisma, JWT cookie auth, Google OAuth, Multer
- `ai-service/`: FastAPI, PyMuPDF, Gemini API, scanned-PDF OCR fallback
- `database`: PostgreSQL or Supabase Postgres

## Features

- Public landing page and Google sign-in
- Cookie-based authentication with protected routes
- Subject -> chapter -> chapter workspace study flow
- Upload notes by paste, `.txt`, or PDF
- Flashcard generation with Gemini
- AI answer review with score and feedback
- Simple active-recall review flow with AI scoring and feedback
- Dashboard summary cards and recent activity
- Progress analytics and charts
- Profile heatmap with year switching
- OCR fallback for scanned/image-based PDFs using Gemini

## Project Structure

```text
flashcard/
  frontend/
  backend/
  ai-service/
  README.md
```

## Prerequisites

Make sure you have:

- Node.js 18+
- npm
- Python 3.10+
- A PostgreSQL database URL
- A Google OAuth web client
- A Gemini API key

## Environment Variables

### Frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
VITE_AI_SERVICE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend

Create `backend/.env`:

```env
PORT=4000
HOST=127.0.0.1
NODE_ENV=development
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=replace_with_a_long_random_secret
JWT_COOKIE_NAME=flashr_session
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret_if_needed
FRONTEND_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
```

### AI Service

Create `ai-service/.env`:

```env
AI_SERVICE_PORT=8000
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

## Google OAuth Setup

In Google Cloud Console, configure your OAuth client with these JavaScript origins:

- `http://localhost:5173`
- `http://127.0.0.1:5173`

Notes:

- Open the app with `http://localhost:5173`, not `127.0.0.1`, if you see an `origin_mismatch` error.
- The frontend and backend should use the same Google client ID.

## Installation

### 1. Frontend

```bash
cd frontend
npm install
```

### 2. Backend

```bash
cd backend
npm install
npx prisma generate
```

If you are connecting Prisma to an existing database and hit migration drift, baseline it first or use `npx prisma db push` for a non-destructive schema sync.

### 3. AI Service

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Running The Project

Open three terminals from the project root.

### Terminal 1: AI Service

```bash
cd /Users/arunimamohan/Documents/flashcard/ai-service
source .venv/bin/activate
./.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Terminal 2: Backend

```bash
cd /Users/arunimamohan/Documents/flashcard/backend
npm run dev
```

### Terminal 3: Frontend

```bash
cd /Users/arunimamohan/Documents/flashcard/frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Then open:

- [http://localhost:5173](http://localhost:5173)

## Health Checks

Once everything is running:

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend health: [http://localhost:4000/api/health](http://localhost:4000/api/health)
- AI service health: [http://localhost:8000/health](http://localhost:8000/health)

## How The Study Flow Works

1. Sign in with Google.
2. Create a subject.
3. Create a chapter inside that subject.
4. Open the chapter workspace.
5. Upload notes or paste notes.
6. Generate flashcards for that chapter.
7. Review that chapter's cards and continue through AI-scored feedback.


