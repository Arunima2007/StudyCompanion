from app.schemas import ProjectionPoint
from app.services.planner import future_value_with_sip


def build_projection(current_savings: float, monthly_sip: float, annual_return_rate: float, years: int) -> list[ProjectionPoint]:
    projection: list[ProjectionPoint] = []
    for year in range(0, years + 1):
        invested = current_savings + (monthly_sip * 12 * year)
        projected_value = future_value_with_sip(current_savings, monthly_sip, annual_return_rate, year)
        projection.append(
            ProjectionPoint(
                year=year,
                invested=round(invested, 2),
                projected_value=round(projected_value, 2),
            )
        )
    return projection
