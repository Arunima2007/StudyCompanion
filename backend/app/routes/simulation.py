from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import SimulationRequest, SimulationResponse
from app.services.recommendation_engine import get_user_or_404
from app.services.simulation import simulate_profile


router = APIRouter(tags=["simulation"])


@router.post("/simulate", response_model=SimulationResponse)
def simulate(payload: SimulationRequest, db: Session = Depends(get_db)) -> SimulationResponse:
    try:
        user = get_user_or_404(db, payload.user_id)
        return simulate_profile(user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
