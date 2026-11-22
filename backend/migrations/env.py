
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from app.core.config import settings
from app.database.base import Base

# Import des modèles pour les enregistrer dans Base.metadata
from app.modules.admin import models as admin_models
from app.modules.products import models as product_models
from app.modules.notifications import models as notification_models


# Configuration Alembic
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# Métadonnées des modèles SQLAlchemy
target_metadata = Base.metadata


def run_migrations_offline():
    """Exécute les migrations sans établir de connexion directe."""

    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Exécute les migrations avec une connexion à la base."""

    connectable = create_engine(
        settings.database_url,
        poolclass=pool.NullPool
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True
        )

        with context.begin_transaction():
            context.run_migrations()

    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
