from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_gemini_api_key, settings
from app.models import GenerateFlashcardsRequest, ReviewAnswerRequest
from app.services.gemini_client import generate_flashcards, review_answer
from app.services.pdf_parser import extract_text_from_pdf

app = FastAPI(title="Flash Card AI Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "port": settings.ai_service_port,
        "provider": "gemini",
        "model": settings.gemini_model,
        "hasApiKey": bool(get_gemini_api_key()),
    }


@app.post("/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    content = await file.read()
    text = await extract_text_from_pdf(content)
    return {"filename": file.filename, "text": text}


@app.post("/flashcards/generate")
async def generate_flashcards_endpoint(request: GenerateFlashcardsRequest):
    result = await generate_flashcards(
        request.notes,
        request.chapter_title,
        request.cards_requested,
    )
    return result


@app.post("/flashcards/review")
async def review_flashcard_answer(request: ReviewAnswerRequest):
    result = await review_answer(
        request.question,
        request.reference_answer,
        request.user_answer,
    )
    return result
