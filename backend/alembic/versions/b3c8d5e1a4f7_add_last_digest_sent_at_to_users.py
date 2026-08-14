"""add last_digest_sent_at to users

Revision ID: b3c8d5e1a4f7
Revises: a7e2f4c9b1d5
Create Date: 2026-08-14 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3c8d5e1a4f7'
down_revision: Union[str, Sequence[str], None] = 'a7e2f4c9b1d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('last_digest_sent_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'last_digest_sent_at')
