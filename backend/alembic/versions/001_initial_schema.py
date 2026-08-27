"""
Initial Schema Migration (Applications Table & Partial Index)

[PRESENTATION-TAG: ALEMBIC-MIGRATIONS]
[PRESENTATION-TAG: POSTGRESQL-STORAGE]
Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-26 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # [PRESENTATION-TAG: ALEMBIC-MIGRATIONS] Create applications table
    op.create_table(
        'applications',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('program', sa.String(length=100), nullable=False),
        sa.Column('gpa', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='SUBMITTED'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index(op.f('ix_applications_id'), 'applications', ['id'], unique=False)
    op.create_index(op.f('ix_applications_email'), 'applications', ['email'], unique=False)
    op.create_index(op.f('ix_applications_program'), 'applications', ['program'], unique=False)
    op.create_index(op.f('ix_applications_is_deleted'), 'applications', ['is_deleted'], unique=False)

    # [PRESENTATION-TAG: POSTGRESQL-STORAGE] Partial compound index for active applications
    op.create_index(
        'idx_email_program_active',
        'applications',
        ['email', 'program', 'is_deleted'],
        postgresql_where=sa.text('is_deleted = false')
    )


def downgrade() -> None:
    # [PRESENTATION-TAG: ALEMBIC-MIGRATIONS] Rollback migration changes
    op.drop_index('idx_email_program_active', table_name='applications')
    op.drop_index(op.f('ix_applications_is_deleted'), table_name='applications')
    op.drop_index(op.f('ix_applications_program'), table_name='applications')
    op.drop_index(op.f('ix_applications_email'), table_name='applications')
    op.drop_index(op.f('ix_applications_id'), table_name='applications')
    op.drop_table('applications')
