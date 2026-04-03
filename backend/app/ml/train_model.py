from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor


BACKEND_DIR = Path(__file__).resolve().parents[2]
DATA_PATH = BACKEND_DIR / "data" / "dummy_investor_profiles.csv"
MODEL_PATH = BACKEND_DIR / "app" / "ml" / "artifacts" / "investment_recommender.joblib"
FEATURES = ["risk_score", "savings_ratio", "age", "goal_amount", "goal_years"]
TARGETS = ["equity_allocation", "debt_allocation", "recommended_sip"]


def train_and_save_model() -> None:
    dataset = pd.read_csv(DATA_PATH)
    model = RandomForestRegressor(
        n_estimators=220,
        max_depth=10,
        random_state=42,
        min_samples_leaf=2,
    )
    model.fit(dataset[FEATURES], dataset[TARGETS])
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Model trained and saved to {MODEL_PATH}")


if __name__ == "__main__":
    train_and_save_model()
