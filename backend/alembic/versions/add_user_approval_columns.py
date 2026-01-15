"""add_user_approval_columns

Revision ID: add_approval_v1
Revises: add_features_v3
Create Date: 2026-01-16

This migration adds approval workflow columns to users table:
- is_approved
- approval_status
- approved_by_id
- approved_at
- rejection_reason
- created_at
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_approval_v1'
down_revision: Union[str, Sequence[str], None] = 'add_features_v3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add approval workflow columns to users table."""

    # Add approval workflow columns
    op.add_column('users', sa.Column('is_approved', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('approval_status', sa.String(20), nullable=False, server_default='APPROVED'))
    op.add_column('users', sa.Column('approved_by_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('approved_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('rejection_reason', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))

    # Add foreign key for approved_by_id
    op.create_foreign_key(
        'fk_users_approved_by_id', 'users', 'users',
        ['approved_by_id'], ['id'], ondelete='SET NULL'
    )


def downgrade() -> None:
    """Remove approval workflow columns from users table."""

    op.drop_constraint('fk_users_approved_by_id', 'users', type_='foreignkey')
    op.drop_column('users', 'created_at')
    op.drop_column('users', 'rejection_reason')
    op.drop_column('users', 'approved_at')
    op.drop_column('users', 'approved_by_id')
    op.drop_column('users', 'approval_status')
    op.drop_column('users', 'is_approved')
