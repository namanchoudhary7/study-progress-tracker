"""add share_token to users

Revision ID: f1b6d3a8c9e2
Revises: e4a9c6b2f8d1
Create Date: 2026-08-14 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1b6d3a8c9e2'
down_revision: Union[str, Sequence[str], None] = 'e4a9c6b2f8d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('share_token', sa.String(32), nullable=True))
    op.create_index('ix_users_share_token', 'users', ['share_token'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_users_share_token', table_name='users')
    op.drop_column('users', 'share_token')
