"""rename is_active to is_current in academic_years

Revision ID: rename_active_current
Revises: add_features_v2
Create Date: 2026-01-20

This migration renames the 'is_active' column to 'is_current' in the academic_years table.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'rename_active_current'
down_revision: Union[str, Sequence[str], None] = 'add_features_v2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Rename is_active to is_current in academic_years table."""
    op.alter_column('academic_years', 'is_active', new_column_name='is_current')


def downgrade() -> None:
    """Rename is_current back to is_active in academic_years table."""
    op.alter_column('academic_years', 'is_current', new_column_name='is_active')
