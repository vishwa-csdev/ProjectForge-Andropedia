import os
from typing import AsyncGenerator
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy import event
from config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("sqlite://") and not db_url.startswith("sqlite+aiosqlite://"):
    db_url = db_url.replace("sqlite://", "sqlite+aiosqlite://", 1)
elif db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

postgres_ssl_required = False
if db_url.startswith("postgresql+asyncpg://"):
    parsed_url = urlsplit(db_url)
    query_pairs = parse_qsl(parsed_url.query)
    postgres_ssl_required = any(key == "sslmode" and value == "require" for key, value in query_pairs)
    query = [(key, value) for key, value in query_pairs if key not in {"channel_binding", "sslmode"}]
    db_url = urlunsplit(parsed_url._replace(query=urlencode(query)))

connect_args = {}
engine_kwargs = {"echo": False}

if "sqlite" in db_url:
    connect_args["check_same_thread"] = False
else:
    if postgres_ssl_required:
        connect_args["ssl"] = True
    # If using asyncpg with Neon/PgBouncer pooler, disable prepared statement cache
    if "asyncpg" in db_url:
        connect_args["statement_cache_size"] = 0
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_async_engine(db_url, connect_args=connect_args, **engine_kwargs)

if "sqlite" in db_url:
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
