from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"


class UserCreate(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    display_name: str = Field(..., min_length=1, max_length=100)


class UserLogin(BaseModel):
    email: str
    password: str


class UserInDB(BaseModel):
    user_id: str
    email: str
    password_hash: str
    display_name: str
    role: UserRole = UserRole.USER
    is_active: bool = True
    created_at: str


class UserResponse(BaseModel):
    user_id: str
    email: str
    display_name: str
    role: UserRole
    is_active: bool
    created_at: str


class UserUpdate(BaseModel):
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    display_name: Optional[str] = None


class InviteUserRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    display_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole = UserRole.USER
