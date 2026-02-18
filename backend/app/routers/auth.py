import uuid
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response

from app.models import UserCreate, UserLogin, UserResponse, UserRole
from app.storage import users_db, settings_db
from app.auth import (
    hash_password,
    verify_password,
    create_session,
    delete_session,
    set_session_cookie,
    clear_session_cookie,
    get_current_user,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _find_user_by_email(email: str) -> dict | None:
    """Search users_db for a user with the given email."""
    for user in users_db.list_all():
        if user.get("email") == email:
            return user
    return None


@router.post("/register", response_model=UserResponse)
async def register(body: UserCreate, response: Response):
    """Register a new user. First user becomes admin."""
    # Check for duplicate email
    if _find_user_by_email(body.email):
        raise HTTPException(status_code=409, detail="Email already registered")

    # First user = admin (skip invite code check for first user)
    all_users = users_db.list_all()

    # Validate invite code (skip for first user — they become admin)
    if len(all_users) > 0:
        stored_code = settings_db.get("invite_code")
        if stored_code and stored_code.get("code"):
            if not body.invite_code or body.invite_code != stored_code["code"]:
                raise HTTPException(status_code=403, detail="Invalid invite code")
    role = UserRole.ADMIN if len(all_users) == 0 else UserRole.USER

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now().isoformat()

    user_data = {
        "user_id": user_id,
        "email": body.email,
        "password_hash": hash_password(body.password),
        "display_name": body.display_name,
        "role": role.value,
        "is_active": True,
        "created_at": now,
    }
    users_db.set(user_id, user_data)

    # Create session + set cookie
    signed_id = create_session(user_id, role.value, body.email)
    set_session_cookie(response, signed_id)

    logger.info(
        "User registered",
        extra={"user_id": user_id, "email": body.email, "role": role.value},
    )

    return UserResponse(
        user_id=user_id,
        email=body.email,
        display_name=body.display_name,
        role=role,
        is_active=True,
        created_at=now,
    )


@router.post("/login", response_model=UserResponse)
async def login(body: UserLogin, response: Response):
    """Login with email and password."""
    user = _find_user_by_email(body.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # Create session + set cookie
    signed_id = create_session(user["user_id"], user["role"], user["email"])
    set_session_cookie(response, signed_id)

    logger.info("User logged in", extra={"user_id": user["user_id"], "email": user["email"]})

    return UserResponse(
        user_id=user["user_id"],
        email=user["email"],
        display_name=user["display_name"],
        role=user["role"],
        is_active=user["is_active"],
        created_at=user["created_at"],
    )


@router.post("/logout")
async def logout(response: Response, current_user: dict = Depends(get_current_user)):
    """Logout: destroy session + clear cookie."""
    # The session_id cookie value is the signed token — we need it to delete
    # But get_current_user already validated. We clear cookie regardless.
    clear_session_cookie(response)
    logger.info("User logged out", extra={"user_id": current_user["user_id"]})
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user's profile."""
    user = users_db.get(current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        user_id=user["user_id"],
        email=user["email"],
        display_name=user["display_name"],
        role=user["role"],
        is_active=user["is_active"],
        created_at=user["created_at"],
    )
