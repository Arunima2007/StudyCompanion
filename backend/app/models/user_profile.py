import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    monthly_income: Mapped[float] = mapped_column(Float, nullable=False)
    monthly_expenses: Mapped[float] = mapped_column(Float, nullable=False)
    current_savings: Mapped[float] = mapped_column(Float, nullable=False)
    goal_name: Mapped[str] = mapped_column(String(120), nullable=False)
    goal_amount: Mapped[float] = mapped_column(Float, nullable=False)
    goal_years: Mapped[int] = mapped_column(Integer, nullable=False)
    risk_answers: Mapped[dict] = mapped_column(JSON, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    savings_ratio: Mapped[float] = mapped_column(Float, nullable=False)
    investment_horizon: Mapped[int] = mapped_column(Integer, nullable=False)
    disposable_income: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
