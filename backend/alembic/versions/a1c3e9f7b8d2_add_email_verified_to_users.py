"""add email_verified to users

Revision ID: a1c3e9f7b8d2
Revises: f320ded86c74
Create Date: 2026-08-13 21:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1c3e9f7b8d2'
down_revision: Union[str, Sequence[str], None] = 'f320ded86c74'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # A boolean default applies to existing rows at the DB level — no backfill needed
    # (unlike username, which required distinct per-row values).
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'email_verified')
