from pydantic import BaseModel, Field


class GenerateFlashcardsRequest(BaseModel):
    notes: str
    chapter_title: str
    review_time_minutes: int = Field(default=15, ge=5, le=120)
    cards_requested: int = Field(default=10, ge=3, le=30)


class ReviewAnswerRequest(BaseModel):
    question: str
    reference_answer: str
    user_answer: str

