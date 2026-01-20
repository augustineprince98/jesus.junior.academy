"""Add new features - January 2026

This migration adds:
1. father_name and mother_name columns to students table
2. is_public, is_published, published_at, expires_at columns to notifications table
3. attachments column to homework table
4. homework_attachments table
5. PUBLIC and PUBLIC_AND_REGISTERED target audience values

Revision ID: add_new_features_jan2026
Revises: rename_is_active_to_is_current
Create Date: 2026-01-21
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_new_features_jan2026'
down_revision = 'rename_is_active_to_is_current'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add father_name and mother_name to students table
    op.add_column('students', sa.Column('father_name', sa.String(100), nullable=True, server_default=''))
    op.add_column('students', sa.Column('mother_name', sa.String(100), nullable=True, server_default=''))
    op.add_column('students', sa.Column('address', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('blood_group', sa.String(5), nullable=True))
    op.add_column('students', sa.Column('emergency_contact', sa.String(15), nullable=True))

    # Add public notice columns to notifications table
    op.add_column('notifications', sa.Column('is_public', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('notifications', sa.Column('is_published', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('notifications', sa.Column('published_at', sa.DateTime(), nullable=True))
    op.add_column('notifications', sa.Column('expires_at', sa.DateTime(), nullable=True))

    # Add attachments JSON column to homework table
    op.add_column('homework', sa.Column('attachments', sa.JSON(), nullable=True))

    # Create homework_attachments table
    op.create_table(
        'homework_attachments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('homework_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('original_filename', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('file_type', sa.String(50), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['homework_id'], ['homework.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Update father_name and mother_name to be NOT NULL with defaults
    # (Do this after initial migration so existing data doesn't break)
    op.execute("UPDATE students SET father_name = '' WHERE father_name IS NULL")
    op.execute("UPDATE students SET mother_name = '' WHERE mother_name IS NULL")
    op.alter_column('students', 'father_name', nullable=False, server_default='')
    op.alter_column('students', 'mother_name', nullable=False, server_default='')


def downgrade() -> None:
    # Drop homework_attachments table
    op.drop_table('homework_attachments')

    # Remove columns from homework table
    op.drop_column('homework', 'attachments')

    # Remove columns from notifications table
    op.drop_column('notifications', 'expires_at')
    op.drop_column('notifications', 'published_at')
    op.drop_column('notifications', 'is_published')
    op.drop_column('notifications', 'is_public')

    # Remove columns from students table
    op.drop_column('students', 'emergency_contact')
    op.drop_column('students', 'blood_group')
    op.drop_column('students', 'address')
    op.drop_column('students', 'mother_name')
    op.drop_column('students', 'father_name')
