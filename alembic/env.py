from logging.config import fileConfig
import os
import sys
import logging
from sqlalchemy import engine_from_config, pool
from alembic import context

logger = logging.getLogger('alembic')

config = context.config

fileConfig(config.config_file_name)

if 'DATABASE_URL' in os.environ:
    config.set_main_option('sqlalchemy.url', os.environ['DATABASE_URL'])

# Normalize SQLAlchemy URL to use psycopg v3 driver if available.
def _normalize_url_for_psycopg(url: str) -> str:
    try:
        import psycopg  # noqa: F401
        # Only rewrite if a driver is not already specified
        if url.startswith('postgresql://'):
            return 'postgresql+psycopg://' + url[len('postgresql://'):]
        if url.startswith('postgres://'):
            return 'postgresql+psycopg://' + url[len('postgres://'):]
    except Exception:
        # psycopg v3 not installed; leave as-is (psycopg2 or others may be present)
        return url
    return url


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    if url:
        url = _normalize_url_for_psycopg(url)
        config.set_main_option('sqlalchemy.url', url)
    if not url:
        logger.error("No sqlalchemy.url configured")
        sys.exit(1)
    
    context.configure(url=url, target_metadata=None, literal_binds=True)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    configuration = config.get_section(config.config_ini_section)
    url = config.get_main_option('sqlalchemy.url')
    if url:
        url = _normalize_url_for_psycopg(url)
        config.set_main_option('sqlalchemy.url', url)
    
    if not url:
        logger.error("No sqlalchemy.url configured - cannot run migrations")
        sys.exit(1)
    
    configuration['sqlalchemy.url'] = url
    
    try:
        connect_timeout = int(os.getenv("DB_CONNECT_TIMEOUT", "10"))
        connect_args = {
            "connect_timeout": connect_timeout,
            "sslmode": "require"
        }
        
        connectable = engine_from_config(
            configuration,
            prefix='sqlalchemy.',
            poolclass=pool.NullPool,
            connect_args=connect_args,
        )

        with connectable.connect() as connection:
            context.configure(connection=connection, target_metadata=None)
            with context.begin_transaction():
                context.run_migrations()
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        sys.exit(1)


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
