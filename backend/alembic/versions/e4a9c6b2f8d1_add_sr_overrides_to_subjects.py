"""add spaced repetition overrides to subjects

Revision ID: e4a9c6b2f8d1
Revises: d3f8a2c7e5b1
Create Date: 2026-08-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4a9c6b2f8d1'
down_revision: Union[str, Sequence[str], None] = 'd3f8a2c7e5b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('subjects', sa.Column('sr_initial_interval_days', sa.Integer(), nullable=True))
    op.add_column('subjects', sa.Column('sr_ease_factor', sa.Numeric(4, 2), nullable=True))


def downgrade() -> None:
    op.drop_column('subjects', 'sr_ease_factor')
    op.drop_column('subjects', 'sr_initial_interval_days')
