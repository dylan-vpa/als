from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...database import get_db
from ...schemas.auth import LoginRequest, SignupRequest, Token, User
from ...services.auth_service import authenticate_user, create_access_token, get_password_hash
from ...models.system_user import SystemUser
from ...core.dependencies import get_current_user

router = APIRouter(tags=["auth"])

@router.post("/signup", response_model=Token)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(SystemUser).filter(SystemUser.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email ya registrado")
    user = SystemUser(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.email)
    return Token(access_token=token)

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")
    token = create_access_token(subject=user.email)
    return Token(access_token=token)

@router.get("/me", response_model=User)
def me(current_user: SystemUser = Depends(get_current_user)):
    return current_user