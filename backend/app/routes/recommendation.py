from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import RecommendationRequest, RecommendationResponse
from app.services.recommendation_engine import build_recommendation, get_user_or_404


router = APIRouter(tags=["recommendation"])


@router.post("/recommendation", response_model=RecommendationResponse)
def get_recommendation(payload: RecommendationRequest, db: Session = Depends(get_db)) -> RecommendationResponse:
    try:
        user = get_user_or_404(db, payload.user_id)
        return build_recommendation(user, payload.annual_return_override)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
