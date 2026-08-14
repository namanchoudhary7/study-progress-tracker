"""add parent_topic_id to topics

Revision ID: d5e8f1a4c7b3
Revises: c9d4e7f2a3b6
Create Date: 2026-08-14 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5e8f1a4c7b3'
down_revision: Union[str, Sequence[str], None] = 'c9d4e7f2a3b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('topics', sa.Column('parent_topic_id', sa.Integer(), nullable=True))
    op.create_index('ix_topics_parent_topic_id', 'topics', ['parent_topic_id'])
    op.create_foreign_key(
        'fk_topics_parent_topic_id_topics',
        'topics',
        'topics',
        ['parent_topic_id'],
        ['id'],
        ondelete='CASCADE',
    )


def downgrade() -> None:
    op.drop_constraint('fk_topics_parent_topic_id_topics', 'topics', type_='foreignkey')
    op.drop_index('ix_topics_parent_topic_id', table_name='topics')
    op.drop_column('topics', 'parent_topic_id')
