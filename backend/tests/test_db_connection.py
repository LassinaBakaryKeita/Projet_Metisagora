from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database.connection import engine


try:
    with engine.connect() as connection:

        result = connection.execute(text("SELECT 1"))

        print("Connexion réussie à NeonDB !")
        print("Résultat de la requête :", result.scalar())

except SQLAlchemyError as exc:

    print("Échec de la connexion à NeonDB.")
    print(type(exc).__name__, str(exc).splitlines()[0])

finally:
    engine.dispose()