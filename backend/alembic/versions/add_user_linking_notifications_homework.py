"""add_user_linking_notifications_homework

Revision ID: add_features_v2
Revises: 3c4baf423ed5
Create Date: 2026-01-14

This migration adds:
1. User-Student/Parent/Teacher linking (FKs in users table)
2. Working days calendar table
3. Notification system tables
4. Homework system tables
5. Student-Parent linking table
6. Result publication and student results tables
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_features_v2'
down_revision: Union[str, Sequence[str], None] = '3c4baf423ed5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 1. USER-ENTITY LINKING
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    # Add FK columns to users table
    op.add_column('users', sa.Column('student_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('parent_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('teacher_id', sa.Integer(), nullable=True))

    op.create_foreign_key(
        'fk_users_student_id', 'users', 'students',
        ['student_id'], ['id'], ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_users_parent_id', 'users', 'parents',
        ['parent_id'], ['id'], ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_users_teacher_id', 'users', 'teachers',
        ['teacher_id'], ['id'], ondelete='SET NULL'
    )

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 2. STUDENT-PARENT LINKING (one student can have multiple parents)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    op.create_table('student_parents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=False),
        sa.Column('relation_type', sa.String(20), nullable=False),  # FATHER, MOTHER, GUARDIAN
        sa.Column('is_primary', sa.Boolean(), default=False),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['parents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'parent_id', name='uq_student_parent')
    )

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 3. WORKING DAYS CALENDAR
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    op.create_table('school_calendar',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('is_working_day', sa.Boolean(), default=True),
        sa.Column('day_type', sa.String(30), nullable=False),  # REGULAR, HOLIDAY, HALF_DAY, EXAM_DAY
        sa.Column('reason', sa.String(200), nullable=True),  # "Diwali", "Summer Vacation", etc.
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('academic_year_id', 'date', name='uq_calendar_date')
    )

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 4. NOTIFICATION SYSTEM
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    # Notification templates (school-wide announcements, holiday notices)
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('notification_type', sa.String(30), nullable=False),  # HOLIDAY, HOMEWORK, ANNOUNCEMENT, FEE_REMINDER, RESULT
        sa.Column('priority', sa.String(10), nullable=False, server_default='NORMAL'),  # LOW, NORMAL, HIGH, URGENT
        sa.Column('target_audience', sa.String(30), nullable=False),  # ALL, PARENTS, STUDENTS, TEACHERS, CLASS_SPECIFIC
        sa.Column('target_class_id', sa.Integer(), nullable=True),  # If CLASS_SPECIFIC
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        sa.Column('created_by_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('scheduled_for', sa.DateTime(), nullable=True),  # For scheduled notifications
        sa.Column('is_sent', sa.Boolean(), default=False),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['target_class_id'], ['school_classes.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )

    # Track which users received which notifications
    op.create_table('notification_recipients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('notification_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('is_read', sa.Boolean(), default=False),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('delivered_via', sa.String(20), nullable=True),  # APP, SMS, EMAIL
        sa.Column('delivered_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['notification_id'], ['notifications.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('notification_id', 'user_id', name='uq_notification_recipient')
    )

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 5. HOMEWORK SYSTEM
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    op.create_table('homework',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('class_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        sa.Column('assigned_by_id', sa.Integer(), nullable=False),  # Teacher who assigned
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('assigned_date', sa.Date(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('is_published', sa.Boolean(), default=False),  # When true, goes out as notification
        sa.Column('published_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['class_id'], ['school_classes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_by_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 6. RESULT PUBLICATION & STUDENT RESULTS
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    op.create_table('result_publications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('class_id', sa.Integer(), nullable=False),
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        sa.Column('marks_visible', sa.Boolean(), default=True),
        sa.Column('results_visible', sa.Boolean(), default=False),
        sa.Column('ranks_visible', sa.Boolean(), default=False),
        sa.Column('published_by_id', sa.Integer(), nullable=True),
        sa.Column('published_at', sa.DateTime(), nullable=True),
        sa.Column('rank_calculation_date', sa.Date(), nullable=True),
        sa.Column('rank_calculated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['class_id'], ['school_classes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['published_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('class_id', 'academic_year_id', name='uq_result_publication')
    )

    op.create_table('student_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('class_id', sa.Integer(), nullable=False),
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        # FA scores
        sa.Column('fa_total_obtained', sa.Integer(), nullable=True),
        sa.Column('fa_total_max', sa.Integer(), nullable=True),
        sa.Column('fa_score', sa.Float(), nullable=True),  # Out of 200
        # Term scores
        sa.Column('term_total_obtained', sa.Integer(), nullable=True),
        sa.Column('term_total_max', sa.Integer(), nullable=True),
        sa.Column('term_score', sa.Float(), nullable=True),  # Out of 800
        # Final
        sa.Column('final_score', sa.Float(), nullable=True),  # Out of 1000
        sa.Column('percentage', sa.Float(), nullable=True),
        sa.Column('grade', sa.String(5), nullable=True),  # A+, A, B, C, D, F
        sa.Column('class_rank', sa.Integer(), nullable=True),
        sa.Column('is_passed', sa.Boolean(), nullable=True),
        sa.Column('computed_at', sa.DateTime(), nullable=True),
        sa.Column('last_updated', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['class_id'], ['school_classes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'class_id', 'academic_year_id', name='uq_student_result')
    )

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 7. ADD PROMOTION STATUS TO ENROLLMENT
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    # Add promotion_status for tracking repeat/held-back students
    op.add_column('enrollments', sa.Column('promotion_status', sa.String(20), nullable=True))
    # Values: PROMOTED, REPEATED, GRADUATED, WITHDRAWN


def downgrade() -> None:
    """Downgrade schema."""

    # Remove promotion_status from enrollments
    op.drop_column('enrollments', 'promotion_status')

    # Drop new tables in reverse order
    op.drop_table('student_results')
    op.drop_table('result_publications')
    op.drop_table('homework')
    op.drop_table('notification_recipients')
    op.drop_table('notifications')
    op.drop_table('school_calendar')
    op.drop_table('student_parents')

    # Remove FK columns from users
    op.drop_constraint('fk_users_teacher_id', 'users', type_='foreignkey')
    op.drop_constraint('fk_users_parent_id', 'users', type_='foreignkey')
    op.drop_constraint('fk_users_student_id', 'users', type_='foreignkey')
    op.drop_column('users', 'teacher_id')
    op.drop_column('users', 'parent_id')
    op.drop_column('users', 'student_id')
