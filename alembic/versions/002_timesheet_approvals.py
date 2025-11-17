"""Add approvals columns to timesheets

Revision ID: 002
Revises: 001
Create Date: 2025-11-17 00:00:00

"""
from alembic import op


revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    # Add columns if they do not exist (idempotent for Postgres)
    op.execute("""
        ALTER TABLE timesheets 
        ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT FALSE;
    """)
    op.execute("""
        ALTER TABLE timesheets 
        ADD COLUMN IF NOT EXISTS approved_by text;
    """)
    op.execute("""
        ALTER TABLE timesheets 
        ADD COLUMN IF NOT EXISTS approved_at timestamptz;
    """)


def downgrade():
    # Non-destructive; keep columns
    pass

