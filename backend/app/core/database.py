from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

db_url = settings.DATABASE_URL
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def run_lightweight_migrations() -> None:
    """Add columns that `create_all` cannot add to pre-existing SQLite tables.

    `Base.metadata.create_all` only creates missing tables, so a column added to
    a model later is never applied to a database that already has the table.
    Each entry is applied only when the table exists and the column is missing.
    """
    from sqlalchemy import inspect, text

    statements = [
        ("protection_records", "page", "INTEGER NOT NULL DEFAULT 1"),
        ("ocr_results", "page", "INTEGER NOT NULL DEFAULT 1"),
        # Existing rows are real uploads, so they default to demo=False.
        ("documents", "demo", "BOOLEAN NOT NULL DEFAULT 0"),
    ]
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table, column, ddl in statements:
            if table not in existing_tables:
                continue
            if column in {c["name"] for c in inspector.get_columns(table)}:
                continue
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
