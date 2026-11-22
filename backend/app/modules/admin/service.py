
from sqlalchemy import select
from sqlalchemy.orm import Session

from fastapi import HTTPException, status

from app.modules.admin.models import Admin
from app.modules.admin.schemas import TokenResponse

from app.core.security import (
    verify_password,
    create_access_token
)



# 1. Authentification de l'administrateur

def authenticate_admin(
    db: Session,
    email: str,
    password: str
) -> TokenResponse:
    """
    Authentifie un administrateur et génère son JWT.

    Étapes :
    1. Rechercher l'administrateur par email.
    2. Vérifier son existence.
    3. Vérifier son mot de passe.
    4. Générer et retourner un JWT.
    """

    # Étape 1 : rechercher l'administrateur
    statement = select(Admin).where(Admin.email == email)

    admin = db.scalar(statement)

    # Étape 2 : vérifier son existence
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect."
        )

    # Étape 3 : vérifier le mot de passe
    password_is_valid = verify_password(
        password,
        admin.hashed_password
    )

    if not password_is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect."
        )

    # Étape 4 : générer le JWT
    access_token = create_access_token(
        data={
            "sub": str(admin.id)
        }
    )

    # Retourner le token
    return TokenResponse(
        access_token=access_token,
        token_type="bearer"
    )
