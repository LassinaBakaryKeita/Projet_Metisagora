
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings


# 1. Création du moteur de connexion
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True
)


# 2. Création de la fabrique de sessions
SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autoflush=False,
    autocommit=False
)


# 3. Dépendance FastAPI pour gérer les sessions
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
