"""reverted migrations

Revision ID: aa44031f2b52
Revises: 7579ffbdb982
Create Date: 2025-10-04 07:35:50.499459

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aa44031f2b52'
down_revision: Union[str, Sequence[str], None] = '7579ffbdb982'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
