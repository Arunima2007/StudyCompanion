import math


def future_value_with_sip(current_savings: float, monthly_sip: float, annual_return_rate: float, years: int) -> float:
    months = max(years * 12, 1)
    monthly_rate = annual_return_rate / 12 / 100
    if monthly_rate == 0:
        return current_savings + (monthly_sip * months)

    compounded_savings = current_savings * math.pow(1 + monthly_rate, months)
    sip_future_value = monthly_sip * ((math.pow(1 + monthly_rate, months) - 1) / monthly_rate) * (1 + monthly_rate)
    return compounded_savings + sip_future_value


def calculate_required_sip(goal_amount: float, current_savings: float, annual_return_rate: float, years: int) -> float:
    months = max(years * 12, 1)
    monthly_rate = annual_return_rate / 12 / 100
    if monthly_rate == 0:
        return max(goal_amount - current_savings, 0) / months

    current_value = current_savings * math.pow(1 + monthly_rate, months)
    remaining_goal = max(goal_amount - current_value, 0)
    annuity_factor = ((math.pow(1 + monthly_rate, months) - 1) / monthly_rate) * (1 + monthly_rate)
    return remaining_goal / annuity_factor if annuity_factor else 0


def calculate_required_return(goal_amount: float, current_savings: float, monthly_sip: float, years: int) -> float:
    low, high = 0.0, 25.0
    for _ in range(40):
        mid = (low + high) / 2
        future_value = future_value_with_sip(current_savings, monthly_sip, mid, years)
        if future_value >= goal_amount:
            high = mid
        else:
            low = mid
    return round(high, 2)
