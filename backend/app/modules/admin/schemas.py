
from pydantic import BaseModel, EmailStr, ConfigDict, Field



# 1. Schéma de connexion

class AdminLogin(BaseModel):
    """
    Données nécessaires pour authentifier un administrateur.
    """

    email: EmailStr
    password: str = Field(
        min_length=8,
        description="Le mot de passe doit contenir au moins 8 caractères."
    )


# 2. Schéma de réponse administrateur

class AdminResponse(BaseModel):
    """
    Informations publiques retournées sur l'administrateur.
    """

    id: int
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)



# 3. Schéma de réponse du token JWT

class TokenResponse(BaseModel):
    """
    Réponse retournée après une authentification réussie.
    """

    access_token: str
    token_type: str = "bearer"
