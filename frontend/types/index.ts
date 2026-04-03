export type RiskQuestionnaire = {
  market_reaction: number;
  investment_style: number;
  liquidity_preference: number;
  goal_priority: number;
  volatility_comfort: number;
};

export type UserCreatePayload = {
  age: number;
  monthly_income: number;
  monthly_expenses: number;
  current_savings: number;
  goal_name: string;
  goal_amount: number;
  goal_years: number;
  risk_questionnaire: RiskQuestionnaire;
};

export type UserProfile = {
  id: string;
  age: number;
  monthly_income: number;
  monthly_expenses: number;
  current_savings: number;
  goal_name: string;
  goal_amount: number;
  goal_years: number;
  risk_score: number;
  savings_ratio: number;
  investment_horizon: number;
  disposable_income: number;
};

export type ProjectionPoint = {
  year: number;
  invested: number;
  projected_value: number;
};

export type SpendingInsight = {
  category: string;
  monthly_amount: number;
  share: number;
};

export type RecommendationResponse = {
  user: UserProfile;
  recommended_sip: number;
  equity_allocation: number;
  debt_allocation: number;
  expected_annual_return: number;
  risk_bucket: string;
  goal_plan: {
    target_amount: number;
    years: number;
    required_monthly_sip: number;
    required_annual_return: number;
  };
  behavioral_analysis: {
    categories: SpendingInsight[];
    discretionary_share: number;
    insight: string;
    suggestion: string;
  };
  explanation: string;
  projection: ProjectionPoint[];
};

export type SimulationResponse = {
  scenario_name: string;
  adjusted_sip: number;
  equity_allocation: number;
  debt_allocation: number;
  expected_annual_return: number;
  projection: ProjectionPoint[];
  explanation: string;
};

export type SimulationPayload = {
  user_id: string;
  sip_amount?: number;
  annual_return_rate?: number;
  years?: number;
  monthly_income_change?: number;
  monthly_expenses_change?: number;
  one_time_expense?: number;
  life_event?: "none" | "job_loss" | "marriage" | "large_expense";
};
