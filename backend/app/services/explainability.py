def generate_recommendation_explanation(
    risk_score: float,
    investment_horizon: int,
    savings_ratio: float,
    equity_allocation: float,
    sip_amount: float,
    event_label: str | None = None,
) -> str:
    reasons: list[str] = []

    if risk_score >= 70:
        reasons.append("your risk score is high")
    elif risk_score >= 45:
        reasons.append("your risk score is moderate")
    else:
        reasons.append("your risk score is conservative")

    if investment_horizon >= 10:
        reasons.append("you have a long-term investment horizon")
    elif investment_horizon >= 5:
        reasons.append("your goal is medium term")
    else:
        reasons.append("your goal is relatively near term")

    if savings_ratio >= 0.35:
        reasons.append("your savings ratio gives you room to take measured market exposure")
    elif savings_ratio < 0.2:
        reasons.append("your savings ratio is tight, so the plan stays more defensive")

    opening = (
        f"You are allocated {round(equity_allocation)}% equity and {round(100 - equity_allocation)}% debt because "
        + " and ".join(reasons)
        + "."
    )
    sip_reason = f" The recommended SIP is approximately Rs. {sip_amount:,.0f} per month to keep your goal plan on track."
    event_reason = f" The simulation also accounts for {event_label.replace('_', ' ')}." if event_label and event_label != "none" else ""
    return opening + sip_reason + event_reason
