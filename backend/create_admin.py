
from getpass import getpass

from sqlalchemy import select

from app.database.connection import SessionLocal
from app.modules.admin.models import Admin
from app.core.security import hash_password


def create_admin():
    print("\n=== Création du premier administrateur Métisagora ===\n")

    email = input("Adresse email : ").strip().lower()

    password = getpass("Mot de passe : ")
    password_confirmation = getpass("Confirmer le mot de passe : ")

    if not email:
        print("Erreur : l'adresse email est obligatoire.")
        return

    if len(password) < 8:
        print("Erreur : le mot de passe doit contenir au moins 8 caractères.")
        return

    if password != password_confirmation:
        print("Erreur : les mots de passe ne correspondent pas.")
        return

    with SessionLocal() as db:
        existing_admin = db.scalar(
            select(Admin).where(Admin.email == email)
        )

        if existing_admin:
            print("Cet administrateur existe déjà.")
            return

        new_admin = Admin(
            email=email,
            hashed_password=hash_password(password)
        )

        try:
            db.add(new_admin)
            db.commit()
            db.refresh(new_admin)

            print("\nAdministrateur créé avec succès !")
            print(f"ID : {new_admin.id}")
            print(f"Email : {new_admin.email}")

        except Exception as error:
            db.rollback()
            print(f"\nErreur lors de la création : {error}")


if __name__ == "__main__":
    create_admin()
