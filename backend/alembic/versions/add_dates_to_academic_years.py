"""Add start_date and end_date to academic_years

Revision ID: add_dates_academic_years
Revises: add_section_to_classes
Create Date: 2026-01-31

Adds start_date and end_date columns to academic_years table so that
the system can properly represent academic year ranges (e.g. April 1 to March 31).
"""
from typing import Sequence, Union
from datetime import date

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_dates_academic_years'
down_revision: Union[str, Sequence[str], None] = 'add_section_to_classes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add start_date and end_date columns to academic_years table."""
    # Add columns as nullable first
    op.add_column('academic_years', sa.Column('start_date', sa.Date(), nullable=True))
    op.add_column('academic_years', sa.Column('end_date', sa.Date(), nullable=True))

    # Populate existing rows: derive dates from the year label (e.g. "2025-2026" -> April 1, 2025 to March 31, 2026)
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, year FROM academic_years")).fetchall()
    for row in rows:
        try:
            parts = row[1].split('-')
            start_year = int(parts[0])
            end_year = int(parts[1])
            conn.execute(
                sa.text("UPDATE academic_years SET start_date = :sd, end_date = :ed WHERE id = :id"),
                {"sd": date(start_year, 4, 1), "ed": date(end_year, 3, 31), "id": row[0]}
            )
        except (ValueError, IndexError):
            # If year format is unexpected, use January 1 to December 31
            conn.execute(
                sa.text("UPDATE academic_years SET start_date = :sd, end_date = :ed WHERE id = :id"),
                {"sd": date(2025, 4, 1), "ed": date(2026, 3, 31), "id": row[0]}
            )

    # Now make columns NOT NULL
    op.alter_column('academic_years', 'start_date', nullable=False)
    op.alter_column('academic_years', 'end_date', nullable=False)


def downgrade() -> None:
    """Remove start_date and end_date columns from academic_years table."""
    op.drop_column('academic_years', 'end_date')
    op.drop_column('academic_years', 'start_date')
