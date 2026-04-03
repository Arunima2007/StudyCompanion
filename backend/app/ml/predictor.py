from pathlib import Path

import numpy as np

try:
    import joblib
except ImportError:  # pragma: no cover
    joblib = None

from app.config import get_settings


FEATURE_ORDER = ["risk_score", "savings_ratio", "age", "goal_amount", "goal_years"]


def heuristic_prediction(features: dict[str, float]) -> tuple[float, float, float]:
    risk_score = features["risk_score"]
    savings_ratio = features["savings_ratio"]
    age = features["age"]
    goal_amount = features["goal_amount"]
    goal_years = features["goal_years"]

    equity = 35 + (risk_score * 0.45) + (goal_years * 1.5) - max(age - 35, 0) * 0.6
    equity += min(savings_ratio * 30, 10)
    equity = float(np.clip(equity, 20, 85))
    debt = 100 - equity

    monthly_goal_pressure = goal_amount / max(goal_years * 12, 1)
    sip = monthly_goal_pressure * (0.08 + savings_ratio * 0.55)
    sip = max(sip, 2500)
    return round(equity, 2), round(debt, 2), round(sip, 2)


def load_model():
    settings = get_settings()
    model_path = Path(settings.model_path)
    if joblib is None or not model_path.exists():
        return None
    return joblib.load(model_path)


def predict_allocations(features: dict[str, float]) -> tuple[float, float, float]:
    model = load_model()
    if model is None:
        return heuristic_prediction(features)

    feature_vector = np.array([[features[key] for key in FEATURE_ORDER]])
    equity, debt, sip = model.predict(feature_vector)[0]
    return round(float(equity), 2), round(float(debt), 2), round(float(sip), 2)
