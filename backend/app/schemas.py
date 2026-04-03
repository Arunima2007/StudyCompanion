from typing import Literal

from pydantic import BaseModel, Field, field_validator


LifeEventType = Literal["none", "job_loss", "marriage", "large_expense"]


class RiskQuestionnaire(BaseModel):
    market_reaction: int = Field(ge=1, le=5)
    investment_style: int = Field(ge=1, le=5)
    liquidity_preference: int = Field(ge=1, le=5)
    goal_priority: int = Field(ge=1, le=5)
    volatility_comfort: int = Field(ge=1, le=5)


class UserCreateRequest(BaseModel):
    age: int = Field(ge=18, le=80)
    monthly_income: float = Field(gt=0)
    monthly_expenses: float = Field(ge=0)
    current_savings: float = Field(ge=0)
    goal_name: str = Field(min_length=2, max_length=120)
    goal_amount: float = Field(gt=0)
    goal_years: int = Field(ge=1, le=40)
    risk_questionnaire: RiskQuestionnaire

    @field_validator("monthly_expenses")
    @classmethod
    def expenses_must_not_exceed_income(cls, value: float, info) -> float:
        income = info.data.get("monthly_income")
        if income is not None and value > income:
            raise ValueError("Monthly expenses cannot exceed monthly income.")
        return value


class UserProfileResponse(BaseModel):
    id: str
    age: int
    monthly_income: float
    monthly_expenses: float
    current_savings: float
    goal_name: str
    goal_amount: float
    goal_years: int
    risk_score: float
    savings_ratio: float
    investment_horizon: int
    disposable_income: float

    model_config = {"from_attributes": True}


class RecommendationRequest(BaseModel):
    user_id: str
    annual_return_override: float | None = Field(default=None, ge=1, le=25)


class ProjectionRequest(BaseModel):
    user_id: str
    sip_amount: float | None = Field(default=None, ge=0)
    annual_return_rate: float | None = Field(default=None, ge=1, le=25)
    years: int | None = Field(default=None, ge=1, le=40)


class SimulationRequest(BaseModel):
    user_id: str
    sip_amount: float | None = Field(default=None, ge=0)
    annual_return_rate: float | None = Field(default=None, ge=1, le=25)
    years: int | None = Field(default=None, ge=1, le=40)
    monthly_income_change: float = 0
    monthly_expenses_change: float = 0
    one_time_expense: float = Field(default=0, ge=0)
    life_event: LifeEventType = "none"


class ProjectionPoint(BaseModel):
    year: int
    invested: float
    projected_value: float


class GoalPlan(BaseModel):
    target_amount: float
    years: int
    required_monthly_sip: float
    required_annual_return: float


class SpendingInsight(BaseModel):
    category: str
    monthly_amount: float
    share: float


class BehavioralAnalysis(BaseModel):
    categories: list[SpendingInsight]
    discretionary_share: float
    insight: str
    suggestion: str


class RecommendationResponse(BaseModel):
    user: UserProfileResponse
    recommended_sip: float
    equity_allocation: float
    debt_allocation: float
    expected_annual_return: float
    risk_bucket: str
    goal_plan: GoalPlan
    behavioral_analysis: BehavioralAnalysis
    explanation: str
    projection: list[ProjectionPoint]


class SimulationResponse(BaseModel):
    scenario_name: str
    adjusted_sip: float
    equity_allocation: float
    debt_allocation: float
    expected_annual_return: float
    projection: list[ProjectionPoint]
    explanation: str
