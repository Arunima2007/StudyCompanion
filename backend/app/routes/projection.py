from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ProjectionPoint, ProjectionRequest
from app.services.projection import build_projection
from app.services.recommendation_engine import build_recommendation, get_user_or_404


router = APIRouter(tags=["projection"])


@router.post("/projection", response_model=list[ProjectionPoint])
def get_projection(payload: ProjectionRequest, db: Session = Depends(get_db)) -> list[ProjectionPoint]:
    try:
        user = get_user_or_404(db, payload.user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    recommendation = build_recommendation(user, payload.annual_return_rate)
    sip_amount = payload.sip_amount or recommendation.recommended_sip
    annual_return_rate = payload.annual_return_rate or recommendation.expected_annual_return
    years = payload.years or user.goal_years
    return build_projection(user.current_savings, sip_amount, annual_return_rate, years)
