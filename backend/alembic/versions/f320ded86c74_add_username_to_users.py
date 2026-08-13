"""add username to users

Revision ID: f320ded86c74
Revises: d17e4cb59ebd
Create Date: 2026-08-13 17:22:20.424078

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f320ded86c74'
down_revision: Union[str, Sequence[str], None] = 'd17e4cb59ebd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add nullable first — existing rows (if any) have no username yet.
    op.add_column('users', sa.Column('username', sa.String(length=30), nullable=True))

    # Backfill: derive a username from each existing user's email local-part,
    # sanitized to [a-z0-9_], de-duplicated with a numeric suffix if needed.
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, email FROM users WHERE username IS NULL ORDER BY id")).fetchall()
    taken: set[str] = set()
    for user_id, email in rows:
        base = "".join(c for c in email.split("@")[0].lower() if c.isalnum() or c == "_")[:24] or "user"
        candidate = base
        suffix = 1
        while candidate in taken:
            suffix += 1
            candidate = f"{base}{suffix}"
        taken.add(candidate)
        conn.execute(sa.text("UPDATE users SET username = :username WHERE id = :id"), {"username": candidate, "id": user_id})

    op.alter_column('users', 'username', nullable=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_column('users', 'username')
