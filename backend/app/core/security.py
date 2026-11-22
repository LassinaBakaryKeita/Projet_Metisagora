
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from pwdlib import PasswordHash
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.connection import get_db
from app.modules.admin.models import Admin



# 1. PASSWORD HASHING

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """Hash un mot de passe avant son stockage en base de données."""
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie un mot de passe avec son hash enregistré."""
    return password_hash.verify(plain_password, hashed_password)



# 2. JWT AUTHENTICATION

bearer_scheme = HTTPBearer(auto_error=False)


def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None
) -> str:
    """Génère un JWT avec une date d'expiration."""

    to_encode = data.copy()

    if expires_delta is None:
        expires_delta = timedelta(
            minutes=settings.access_token_expire_minutes
        )

    expire = datetime.now(timezone.utc) + expires_delta

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )

    return encoded_jwt



# 3. CURRENT ADMIN AUTHENTICATION

def get_current_admin(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme)
    ],
    db: Annotated[Session, Depends(get_db)]
) -> Admin:
    """
    Vérifie le JWT reçu et récupère l'administrateur connecté.
    Cette fonction sera utilisée comme dépendance dans les routes protégées.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les identifiants.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Vérifier la présence du token
    if credentials is None:
        raise credentials_exception

    try:
        # Décoder et vérifier le JWT
        payload = jwt.decode(
            credentials.credentials,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )

        # Récupérer l'identifiant de l'administrateur
        admin_id = payload.get("sub")

        if admin_id is None:
            raise credentials_exception

        admin_id = int(admin_id)

    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise credentials_exception

    # Vérifier que l'administrateur existe toujours en base
    statement = select(Admin).where(Admin.id == admin_id)

    admin = db.scalar(statement)

    if admin is None:
        raise credentials_exception

    return admin

