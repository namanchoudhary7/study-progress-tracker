"""add flashcards

Revision ID: c4f7a1e9d3b5
Revises: a1c9e4f7b2d8
Create Date: 2026-08-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4f7a1e9d3b5'
down_revision: Union[str, Sequence[str], None] = 'a1c9e4f7b2d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'flashcards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('topic_id', sa.Integer(), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('answer', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_flashcards_user_id'), 'flashcards', ['user_id'], unique=False)
    op.create_index(op.f('ix_flashcards_topic_id'), 'flashcards', ['topic_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_flashcards_topic_id'), table_name='flashcards')
    op.drop_index(op.f('ix_flashcards_user_id'), table_name='flashcards')
    op.drop_table('flashcards')
