from app.schemas import RiskQuestionnaire


def calculate_savings_ratio(monthly_income: float, monthly_expenses: float) -> float:
    if monthly_income <= 0:
        return 0.0
    return max(monthly_income - monthly_expenses, 0) / monthly_income


def calculate_disposable_income(monthly_income: float, monthly_expenses: float) -> float:
    return max(monthly_income - monthly_expenses, 0)


def calculate_investment_horizon(age: int, goal_years: int) -> int:
    retirement_horizon = max(60 - age, 3)
    return max(goal_years, min(retirement_horizon, 35))


def calculate_risk_score(questionnaire: RiskQuestionnaire) -> float:
    raw_values = [
        questionnaire.market_reaction,
        questionnaire.investment_style,
        questionnaire.liquidity_preference,
        questionnaire.goal_priority,
        questionnaire.volatility_comfort,
    ]
    max_score = len(raw_values) * 5
    min_score = len(raw_values) * 1
    raw_total = sum(raw_values)
    normalized = (raw_total - min_score) / (max_score - min_score)
    return round(normalized * 100, 2)
