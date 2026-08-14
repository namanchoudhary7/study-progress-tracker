"""add digest_frequency to users

Revision ID: a7e2f4c9b1d5
Revises: f1b6d3a8c9e2
Create Date: 2026-08-14 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7e2f4c9b1d5'
down_revision: Union[str, Sequence[str], None] = 'f1b6d3a8c9e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    digest_frequency = sa.Enum('off', 'weekly', 'monthly', name='digest_frequency')
    digest_frequency.create(op.get_bind(), checkfirst=True)
    op.add_column(
        'users',
        sa.Column('digest_frequency', digest_frequency, nullable=False, server_default='off'),
    )


def downgrade() -> None:
    op.drop_column('users', 'digest_frequency')
    sa.Enum(name='digest_frequency').drop(op.get_bind(), checkfirst=True)
