from copy import deepcopy

from app.schemas import SimulationRequest, SimulationResponse
from app.services.explainability import generate_recommendation_explanation
from app.services.projection import build_projection
from app.services.recommendation_engine import build_recommendation


def simulate_profile(user, request: SimulationRequest) -> SimulationResponse:
    simulated = deepcopy(user)
    scenario_name = request.life_event.replace("_", " ").title() if request.life_event != "none" else "Custom Scenario"

    if request.life_event == "job_loss":
        simulated.monthly_income *= 0.45
        simulated.monthly_expenses *= 0.9
    elif request.life_event == "marriage":
        simulated.monthly_expenses *= 1.2
        simulated.goal_amount *= 1.1
    elif request.life_event == "large_expense":
        simulated.current_savings = max(simulated.current_savings - max(request.one_time_expense, simulated.monthly_expenses * 3), 0)

    simulated.monthly_income = max(simulated.monthly_income + request.monthly_income_change, 0)
    simulated.monthly_expenses = max(simulated.monthly_expenses + request.monthly_expenses_change, 0)
    simulated.disposable_income = max(simulated.monthly_income - simulated.monthly_expenses, 0)
    simulated.savings_ratio = simulated.disposable_income / simulated.monthly_income if simulated.monthly_income else 0

    recommendation = build_recommendation(simulated, request.annual_return_rate)
    adjusted_sip = round(request.sip_amount or recommendation.recommended_sip, 2)
    years = request.years or simulated.goal_years
    expected_return = request.annual_return_rate or recommendation.expected_annual_return
    projection = build_projection(simulated.current_savings, adjusted_sip, expected_return, years)
    explanation = generate_recommendation_explanation(
        simulated.risk_score,
        simulated.investment_horizon,
        simulated.savings_ratio,
        recommendation.equity_allocation,
        adjusted_sip,
        request.life_event,
    )

    return SimulationResponse(
        scenario_name=scenario_name,
        adjusted_sip=adjusted_sip,
        equity_allocation=recommendation.equity_allocation,
        debt_allocation=recommendation.debt_allocation,
        expected_annual_return=expected_return,
        projection=projection,
        explanation=explanation,
    )
