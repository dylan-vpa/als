# back/scripts/list_users.py
import json
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.database import SessionLocal
from app.models.system_user import SystemUser

with SessionLocal() as db:
    users = (
        db.query(SystemUser)
        .order_by(SystemUser.id)
        .all()
    )

payload = [
    {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }
    for user in users
]

print(json.dumps(payload, ensure_ascii=False, indent=2))