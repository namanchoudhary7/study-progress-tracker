"""add resources

Revision ID: d3f8a2c7e5b1
Revises: b7d4f1a9c3e6
Create Date: 2026-08-14 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd3f8a2c7e5b1'
down_revision: Union[str, Sequence[str], None] = 'b7d4f1a9c3e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'resources',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('topic_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.Enum('link', 'note', name='resource_type'), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('url', sa.String(length=2000), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_resources_user_id'), 'resources', ['user_id'], unique=False)
    op.create_index(op.f('ix_resources_topic_id'), 'resources', ['topic_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_resources_topic_id'), table_name='resources')
    op.drop_index(op.f('ix_resources_user_id'), table_name='resources')
    op.drop_table('resources')
    sa.Enum(name='resource_type').drop(op.get_bind(), checkfirst=False)
