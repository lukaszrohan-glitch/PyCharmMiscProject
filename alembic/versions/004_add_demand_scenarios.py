"""add demand scenarios"

Revision ID: 004_add_demand_scenarios
Revises: 003_add_contact_person_to_customers_and_orders
Create Date: 2025-12-03 21:30:00.000000

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_add_demand_scenarios'
down_revision = '003_add_contact_person_to_customers_and_orders'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'demand_scenarios',
        sa.Column('scenario_id', sa.String(length=64), primary_key=True),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('multiplier', sa.Numeric(10, 4), nullable=False, server_default='1.0'),
        sa.Column('backlog_weeks', sa.Numeric(10, 4), nullable=False, server_default='4'),
        sa.Column('created_by', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('idx_demand_scenarios_created_at', 'demand_scenarios', ['created_at'])


def downgrade() -> None:
    op.drop_index('idx_demand_scenarios_created_at', table_name='demand_scenarios')
    op.drop_table('demand_scenarios')

