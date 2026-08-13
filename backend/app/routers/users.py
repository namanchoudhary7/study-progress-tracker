from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.cookies import clear_auth_cookies
from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import AccountDeleteRequest, PasswordChangeRequest, UserRead, UserUpdate
from app.services.email import send_verification_email

router = APIRouter(prefix="/users", tags=["users"])


@router.patch("/me", response_model=UserRead)
def update_me(
    payload: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> User:
    updates = payload.model_dump(exclude_unset=True)

    if "username" in updates and updates["username"] != current_user.username:
        if db.scalar(select(User).where(User.username == updates["username"])):
            raise HTTPException(status_code=409, detail="Username already taken")

    email_changed = "email" in updates and updates["email"] != current_user.email
    if email_changed:
        if db.scalar(select(User).where(User.email == updates["email"])):
            raise HTTPException(status_code=409, detail="Email already registered")

    for field, value in updates.items():
        setattr(current_user, field, value)

    if email_changed:
        current_user.email_verified = False

    db.commit()
    db.refresh(current_user)

    if email_changed:
        send_verification_email(current_user.id, current_user.email)

    return current_user


@router.post("/me/password", status_code=204)
def change_password(
    payload: PasswordChangeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> None:
    if current_user.hashed_password is None:
        raise HTTPException(status_code=400, detail="This account signs in with Google and has no password")
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()


@router.delete("/me", status_code=204)
def delete_me(
    payload: AccountDeleteRequest,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    if current_user.hashed_password is not None:
        if not payload.password or not verify_password(payload.password, current_user.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect password")
    else:
        if not payload.confirmation or payload.confirmation != current_user.username:
            raise HTTPException(status_code=400, detail="Confirmation text does not match your username")

    db.delete(current_user)
    db.commit()
    clear_auth_cookies(response)
