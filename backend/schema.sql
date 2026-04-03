CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,
    age INTEGER NOT NULL CHECK (age BETWEEN 18 AND 80),
    monthly_income DOUBLE PRECISION NOT NULL CHECK (monthly_income > 0),
    monthly_expenses DOUBLE PRECISION NOT NULL CHECK (monthly_expenses >= 0),
    current_savings DOUBLE PRECISION NOT NULL CHECK (current_savings >= 0),
    goal_name VARCHAR(120) NOT NULL,
    goal_amount DOUBLE PRECISION NOT NULL CHECK (goal_amount > 0),
    goal_years INTEGER NOT NULL CHECK (goal_years BETWEEN 1 AND 40),
    risk_answers JSONB NOT NULL,
    risk_score DOUBLE PRECISION NOT NULL,
    savings_ratio DOUBLE PRECISION NOT NULL,
    investment_horizon INTEGER NOT NULL,
    disposable_income DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
