"""add_teacher_events_achievements

Revision ID: add_features_v3
Revises: add_features_v2
Create Date: 2026-01-14

This migration adds:
1. Teacher Attendance (biometric check-in/out)
2. Teacher Leave Management
3. Achievements (Achievers Club)
4. Events (Activities/Celebrations)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_features_v3'
down_revision: Union[str, Sequence[str], None] = 'add_features_v2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 1. TEACHER ATTENDANCE (Biometric Entry)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    op.create_table('teacher_attendance',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('check_in_time', sa.Time(), nullable=True),
        sa.Column('check_out_time', sa.Time(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='PRESENT'),  # PRESENT, ABSENT, HALF_DAY, ON_LEAVE
        sa.Column('remarks', sa.String(200), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['teacher_id'], ['teachers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('teacher_id', 'date', name='uq_teacher_attendance_date')
    )

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 2. TEACHER LEAVE MANAGEMENT
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    op.create_table('teacher_leaves',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('leave_type', sa.String(20), nullable=False),  # CASUAL, SICK, EARNED, MATERNITY, EMERGENCY
        sa.Column('from_date', sa.Date(), nullable=False),
        sa.Column('to_date', sa.Date(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='PENDING'),  # PENDING, APPROVED, REJECTED, CANCELLED
        sa.Column('applied_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('reviewed_by_id', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('review_remarks', sa.String(200), nullable=True),
        sa.ForeignKeyConstraint(['teacher_id'], ['teachers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 3. ACHIEVEMENTS (Achievers Club)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    op.create_table('achievements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=True),  # Optional - school-level achievements don't need a student
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.String(30), nullable=False),  # ACADEMIC, SPORTS, ARTS, SCIENCE, LEADERSHIP, COMMUNITY, OTHER
        sa.Column('achievement_date', sa.Date(), nullable=False),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_by_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('academic_year_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 4. EVENTS (Activities/Celebrations)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    op.create_table('events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('event_type', sa.String(30), nullable=False),  # CELEBRATION, SPORTS, CULTURAL, ACADEMIC, HOLIDAY, MEETING, OTHER
        sa.Column('event_date', sa.Date(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=True),
        sa.Column('end_time', sa.Time(), nullable=True),
        sa.Column('venue', sa.String(200), nullable=True),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'),
        # Target audience
        sa.Column('for_students', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('for_parents', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('for_teachers', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('target_class_id', sa.Integer(), nullable=True),
        # Metadata
        sa.Column('created_by_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('academic_year_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['target_class_id'], ['school_classes.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for common queries
    op.create_index('ix_teacher_attendance_date', 'teacher_attendance', ['date'])
    op.create_index('ix_teacher_leaves_status', 'teacher_leaves', ['status'])
    op.create_index('ix_achievements_category', 'achievements', ['category'])
    op.create_index('ix_achievements_is_public', 'achievements', ['is_public'])
    op.create_index('ix_events_event_date', 'events', ['event_date'])
    op.create_index('ix_events_is_public', 'events', ['is_public'])


def downgrade() -> None:
    """Downgrade schema."""

    # Drop indexes
    op.drop_index('ix_events_is_public', table_name='events')
    op.drop_index('ix_events_event_date', table_name='events')
    op.drop_index('ix_achievements_is_public', table_name='achievements')
    op.drop_index('ix_achievements_category', table_name='achievements')
    op.drop_index('ix_teacher_leaves_status', table_name='teacher_leaves')
    op.drop_index('ix_teacher_attendance_date', table_name='teacher_attendance')

    # Drop tables in reverse order
    op.drop_table('events')
    op.drop_table('achievements')
    op.drop_table('teacher_leaves')
    op.drop_table('teacher_attendance')
