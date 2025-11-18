"""Add contact_person to customers and orders

Revision ID: 003
Revises: 002
Create Date: 2025-11-18 21:25:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use batch operations for SQLite compatibility
    with op.batch_alter_table('customers') as batch:
        batch.add_column(sa.Column('contact_person', sa.String(), nullable=True))

    with op.batch_alter_table('orders') as batch:
        batch.add_column(sa.Column('contact_person', sa.String(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('orders') as batch:
        batch.drop_column('contact_person')

    with op.batch_alter_table('customers') as batch:
        batch.drop_column('contact_person')

