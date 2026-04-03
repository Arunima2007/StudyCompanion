from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app.routes.projection import router as projection_router
from app.routes.recommendation import router as recommendation_router
from app.routes.simulation import router as simulation_router
from app.routes.user import router as user_router


settings = get_settings()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Personalized Investment Recommender API",
    version="1.0.0",
    description="AI-powered investment planning backend built with FastAPI and PostgreSQL.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(recommendation_router)
app.include_router(simulation_router)
app.include_router(projection_router)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
