
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.integrations.ai.client import create_gemini_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialisation du client Gemini
    app.state.gemini_client = create_gemini_client()

    yield

    # Fermeture propre du client Gemini
    await app.state.gemini_client.aio.aclose()


app = FastAPI(
    title="Métisagora API",
    description="Backend API for an AI-powered WhatsApp sales assistant",
    version="1.0.0",
    lifespan=lifespan
)


# Configuration CORS
origins = [
    "http://localhost:3000",
    "https://metisagora.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Enregistrement de toutes les routes de l'API
app.include_router(api_router)


@app.get("/")
async def root():
    return {
        "message": "Métisagora backend is running successfully",
        "status": "running"
    }


@app.get("/test-ai-client")
async def test_ai_client(request: Request):
    client = request.app.state.gemini_client

    return {
        "client_initialized": client is not None,
        "provider": "Google Gemini"
    }
