from app.schemas import BehavioralAnalysis, SpendingInsight


def analyze_spending(monthly_expenses: float, savings_ratio: float) -> BehavioralAnalysis:
    # Mock categories are distributed to keep the UX realistic even without bank feeds.
    weights = {
        "Essentials": 0.42,
        "Housing": 0.23,
        "Leisure": 0.12 + max(0.05 - savings_ratio / 4, 0),
        "Dining": 0.11,
        "Shopping": 0.12,
    }

    total_weight = sum(weights.values())
    categories = [
        SpendingInsight(
            category=category,
            monthly_amount=round(monthly_expenses * weight / total_weight, 2),
            share=round(weight / total_weight, 2),
        )
        for category, weight in weights.items()
    ]

    discretionary_categories = {"Leisure", "Dining", "Shopping"}
    discretionary_share = round(sum(item.share for item in categories if item.category in discretionary_categories), 2)
    highest_discretionary = max(
        (item for item in categories if item.category in discretionary_categories),
        key=lambda item: item.monthly_amount,
    )

    if discretionary_share >= 0.35:
        insight = "Your discretionary spending is elevated relative to your savings pattern."
        suggestion = (
            f"Reduce {highest_discretionary.category.lower()} by 10-15% to unlock more monthly investments."
        )
    else:
        insight = "Your spending mix is balanced enough to support regular investing."
        suggestion = "Keep discretionary spending stable and redirect future salary growth into SIP increases."

    return BehavioralAnalysis(
        categories=categories,
        discretionary_share=discretionary_share,
        insight=insight,
        suggestion=suggestion,
    )
