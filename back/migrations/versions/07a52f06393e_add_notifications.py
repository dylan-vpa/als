"""add_notifications

Revision ID: 07a52f06393e
Revises: 9a85a93d020b
Create Date: 2025-10-29 12:12:37.868519

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '07a52f06393e'
down_revision: Union[str, None] = '9a85a93d020b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("oit_documents", sa.Column("review_notes", sa.Text(), nullable=True))
    op.add_column(
        "oit_documents",
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("system_users.id", ondelete="SET NULL"), nullable=True)
    )
    op.create_index("ix_oit_documents_created_by_id", "oit_documents", ["created_by_id"])

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("system_users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("document_id", sa.Integer(), sa.ForeignKey("oit_documents.id", ondelete="SET NULL"), nullable=True),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("payload", sa.Text(), nullable=True),
        sa.Column("read_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_document_id", "notifications", ["document_id"])
    op.create_index("ix_notifications_created_at", "notifications", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_notifications_created_at", table_name="notifications")
    op.drop_index("ix_notifications_document_id", table_name="notifications")
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_table("notifications")

    op.drop_index("ix_oit_documents_created_by_id", table_name="oit_documents")
    op.drop_column("oit_documents", "created_by_id")
    op.drop_column("oit_documents", "review_notes")
