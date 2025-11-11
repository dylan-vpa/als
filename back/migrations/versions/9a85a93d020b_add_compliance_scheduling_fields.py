"""add_compliance_scheduling_fields

Revision ID: 9a85a93d020b
Revises: 
Create Date: 2025-10-29 09:53:05.862921

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9a85a93d020b'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'system_users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_system_users_id', 'system_users', ['id'], unique=False)
    op.create_index('ix_system_users_email', 'system_users', ['email'], unique=True)

    op.create_table(
        'resources',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default=sa.text('1')),
        sa.Column('available', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_resources_id', 'resources', ['id'], unique=False)

    op.create_table(
        'oit_documents',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('original_name', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default=sa.text("'check'")),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('alerts', sa.Text(), nullable=True),
        sa.Column('missing', sa.Text(), nullable=True),
        sa.Column('evidence', sa.Text(), nullable=True),
        sa.Column('compliance_bundle_path', sa.String(), nullable=True),
        sa.Column('compliance_report_path', sa.String(), nullable=True),
        sa.Column('approval_status', sa.String(), nullable=False, server_default=sa.text("'pending'")),
        sa.Column('approved_schedule_date', sa.DateTime(), nullable=True),
        sa.Column('resource_plan', sa.Text(), nullable=True),
        sa.Column('resource_gaps', sa.Text(), nullable=True),
        sa.Column('approval_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_oit_documents_id', 'oit_documents', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_oit_documents_id', table_name='oit_documents')
    op.drop_table('oit_documents')
    op.drop_index('ix_resources_id', table_name='resources')
    op.drop_table('resources')
    op.drop_index('ix_system_users_email', table_name='system_users')
    op.drop_index('ix_system_users_id', table_name='system_users')
    op.drop_table('system_users')
