
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.modules.admin import service
from app.modules.admin.models import Admin
from app.modules.admin.schemas import (
    AdminLogin,
    AdminResponse,
    TokenResponse
)

from app.core.security import get_current_admin



# 1. Configuration du routeur Admin
router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)



# 2. Endpoint : Connexion administrateur ( /admin/login)
@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    credentials: AdminLogin,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Authentifie un administrateur et retourne un JWT.
    """

    return service.authenticate_admin(
        db=db,
        email=str(credentials.email),
        password=credentials.password
    )



# 3. Endpoint : Informations de l'administrateur connecté ( /admin/me)
@router.get(
    "/me",
    response_model=AdminResponse
)
def get_admin_profile(
    current_admin: Annotated[Admin, Depends(get_current_admin)]
):
    """
    Retourne les informations de l'administrateur connecté.
    """

    return current_admin
