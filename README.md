# Flashr

Flashr is a full-stack AI-powered flashcard study application for students. It lets users upload or paste lecture notes, generate flashcards with Google Gemini, review answers with AI feedback, and track study progress over time.

## Stack

- `frontend/`: React, Vite, JavaScript, React Router, Tailwind CSS, Axios, React Query, Recharts
- `backend/`: Node.js, Express, Prisma, JWT cookie auth, Google OAuth, Multer
- `ai-service/`: FastAPI, PyMuPDF, Gemini API integration
- `database/`: PostgreSQL-compatible database such as Supabase Postgres

## Features

- Public landing page and Google-only sign-in
- Secure `httpOnly` JWT session cookies
- Subject-based study room with chapter-level workflows
- Upload notes per chapter and generate flashcards from them
- Review flashcards with AI-evaluated written answers
- Spaced repetition ratings: `Again`, `Hard`, `Medium`, `Easy`
- Dashboard, progress charts, and profile heatmap

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
- Python 3.10+ recommended
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

In Google Cloud Console, configure your OAuth web application with:

### Authorized JavaScript origins

- `http://localhost:5173`
- `http://127.0.0.1:5173`

### Notes

- If you use `localhost` in the browser, keep `FRONTEND_URL=http://localhost:5173`.
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

### 3. AI Service

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Running The Project

Open three terminals.

### Terminal 1: AI Service

```bash
cd ai-service
source .venv/bin/activate
./.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Terminal 2: Backend

```bash
cd backend
npm run dev
```

### Terminal 3: Frontend

```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Then open:

- `http://localhost:5173`

## API Health Checks

Once everything is running:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:4000/api/health`
- AI service health: `http://localhost:8000/health`

## Notes About Current Behavior

- Study room flow is subject -> chapter -> chapter workspace.
- Review can be filtered to a specific chapter.
- Review time currently guides flashcard generation, not spaced repetition intervals directly.

## Troubleshooting

### Google OAuth `origin_mismatch`

Make sure:

- you are opening `http://localhost:5173`
- the OAuth client includes `http://localhost:5173`
- you wait a few minutes after saving changes in Google Cloud Console

### Backend crashes on invalid input

Validation errors are now handled and returned as JSON instead of crashing the server.

### Database issues

Check that:

- `DATABASE_URL` is valid
- Prisma client is generated
- your Postgres database is reachable from your machine

## GitHub Push Flow

If you want to push this project to GitHub:

```bash
git init
git add .
git commit -m "Initial Flashr app setup"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## License

This project is intended for personal or educational use unless you choose to add a different license.
