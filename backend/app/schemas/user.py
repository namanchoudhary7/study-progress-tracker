from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=30, pattern=r"^[a-z0-9_]+$")
    password: str
    display_name: str | None = None


class UserLogin(BaseModel):
    identifier: str = Field(min_length=1)
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    username: str
    display_name: str | None
    created_at: datetime
    email_verified: bool
    has_password: bool
    share_token: str | None


class AuthResponse(UserRead):
    csrf_token: str


class EmailVerifyRequest(BaseModel):
    token: str


class UserUpdate(BaseModel):
    display_name: str | None = None
    username: str | None = Field(default=None, min_length=3, max_length=30, pattern=r"^[a-z0-9_]+$")
    email: EmailStr | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class AccountDeleteRequest(BaseModel):
    password: str | None = None
    confirmation: str | None = None
