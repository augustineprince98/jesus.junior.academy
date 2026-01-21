"""Add section column to school_classes table

Revision ID: add_section_to_classes
Revises: add_new_features_jan2026
Create Date: 2026-01-21
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_section_to_classes'
down_revision = 'add_new_features_jan2026'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add section column to school_classes table
    # Using execute to handle if column already exists
    try:
        op.add_column('school_classes', sa.Column('section', sa.String(10), nullable=True))
    except Exception:
        # Column might already exist
        pass


def downgrade() -> None:
    try:
        op.drop_column('school_classes', 'section')
    except Exception:
        pass
