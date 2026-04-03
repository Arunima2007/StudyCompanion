from sqlalchemy.orm import Session

from app.models import UserProfile
from app.ml.predictor import predict_allocations
from app.schemas import GoalPlan, RecommendationResponse, UserProfileResponse
from app.services.behavior import analyze_spending
from app.services.explainability import generate_recommendation_explanation
from app.services.planner import calculate_required_return, calculate_required_sip
from app.services.projection import build_projection


def build_recommendation(user: UserProfile, annual_return_override: float | None = None) -> RecommendationResponse:
    features = {
        "risk_score": user.risk_score,
        "savings_ratio": user.savings_ratio,
        "age": float(user.age),
        "goal_amount": user.goal_amount,
        "goal_years": float(user.goal_years),
    }
    equity, debt, model_sip = predict_allocations(features)

    # Dynamic risk adjustment reflects changes in affordability and income strength.
    equity_adjustment = 0
    if user.savings_ratio < 0.2:
        equity_adjustment -= 8
    elif user.savings_ratio > 0.4:
        equity_adjustment += 5
    if user.monthly_income > (user.monthly_expenses * 2):
        model_sip *= 1.1

    equity = min(max(equity + equity_adjustment, 15), 85)
    debt = round(100 - equity, 2)

    affordable_sip = user.disposable_income * 0.7
    goal_based_sip = calculate_required_sip(user.goal_amount, user.current_savings, annual_return_override or 11.0, user.goal_years)
    recommended_sip = min(max(model_sip, goal_based_sip * 0.85), max(affordable_sip, 2500))
    recommended_sip = round(recommended_sip, 2)

    expected_annual_return = annual_return_override or round(((equity / 100) * 13) + ((debt / 100) * 7), 2)
    required_return = calculate_required_return(
        user.goal_amount,
        user.current_savings,
        recommended_sip,
        user.goal_years,
    )
    goal_plan = GoalPlan(
        target_amount=round(user.goal_amount, 2),
        years=user.goal_years,
        required_monthly_sip=round(goal_based_sip, 2),
        required_annual_return=required_return,
    )

    behavioral_analysis = analyze_spending(user.monthly_expenses, user.savings_ratio)
    explanation = generate_recommendation_explanation(
        user.risk_score,
        user.investment_horizon,
        user.savings_ratio,
        equity,
        recommended_sip,
    )

    risk_bucket = "Aggressive" if user.risk_score >= 70 else "Moderate" if user.risk_score >= 45 else "Conservative"
    projection = build_projection(user.current_savings, recommended_sip, expected_annual_return, user.goal_years)

    return RecommendationResponse(
        user=UserProfileResponse.model_validate(user),
        recommended_sip=recommended_sip,
        equity_allocation=round(equity, 2),
        debt_allocation=round(debt, 2),
        expected_annual_return=expected_annual_return,
        risk_bucket=risk_bucket,
        goal_plan=goal_plan,
        behavioral_analysis=behavioral_analysis,
        explanation=explanation,
        projection=projection,
    )


def get_user_or_404(db: Session, user_id: str) -> UserProfile:
    user = db.get(UserProfile, user_id)
    if user is None:
        raise ValueError("User profile not found.")
    return user
