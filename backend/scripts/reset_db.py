from app.core.database import Base, engine
from sqlalchemy import text

# Drop alembic version table
with engine.connect() as conn:
    conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE"))
    conn.commit()
    print("✅ Dropped alembic_version table")

# Drop all tables
Base.metadata.drop_all(engine)
print("✅ Dropped all tables")

# Recreate tables
Base.metadata.create_all(engine)
print("✅ Created all tables fresh")