from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import UserProfile
from app.schemas import UserCreateRequest, UserProfileResponse
from app.services.feature_engineering import (
    calculate_disposable_income,
    calculate_investment_horizon,
    calculate_risk_score,
    calculate_savings_ratio,
)


router = APIRouter(prefix="/user", tags=["user"])


@router.post("/create", response_model=UserProfileResponse)
def create_user(payload: UserCreateRequest, db: Session = Depends(get_db)) -> UserProfile:
    risk_score = calculate_risk_score(payload.risk_questionnaire)
    savings_ratio = calculate_savings_ratio(payload.monthly_income, payload.monthly_expenses)
    disposable_income = calculate_disposable_income(payload.monthly_income, payload.monthly_expenses)
    investment_horizon = calculate_investment_horizon(payload.age, payload.goal_years)

    user = UserProfile(
        age=payload.age,
        monthly_income=payload.monthly_income,
        monthly_expenses=payload.monthly_expenses,
        current_savings=payload.current_savings,
        goal_name=payload.goal_name,
        goal_amount=payload.goal_amount,
        goal_years=payload.goal_years,
        risk_answers=payload.risk_questionnaire.model_dump(),
        risk_score=risk_score,
        savings_ratio=round(savings_ratio, 2),
        investment_horizon=investment_horizon,
        disposable_income=round(disposable_income, 2),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(user_id: str, db: Session = Depends(get_db)) -> UserProfile:
    user = db.get(UserProfile, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User profile not found.")
    return user
