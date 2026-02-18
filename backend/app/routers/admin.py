import uuid
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from app.models import UserResponse, UserUpdate, UserRole, InviteUserRequest, ApiKeysUpdate, ApiKeysResponse
from app.storage import users_db, settings_db
from app.auth import hash_password, require_admin
from app.key_manager import get_masked_keys, save_keys

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

NOTIFICATION_SETTINGS_KEY = "notifications"
INVITE_CODE_KEY = "invite_code"


# --- User Management ---

@router.get("/users", response_model=list[UserResponse])
async def list_users(current_user: dict = Depends(require_admin)):
    """List all users (admin only)."""
    all_users = users_db.list_all()
    return [
        UserResponse(
            user_id=u["user_id"],
            email=u["email"],
            display_name=u["display_name"],
            role=u["role"],
            is_active=u["is_active"],
            created_at=u["created_at"],
        )
        for u in all_users
    ]


@router.post("/users/invite", response_model=UserResponse)
async def invite_user(body: InviteUserRequest, current_user: dict = Depends(require_admin)):
    """Create a new user with specified role (admin only)."""
    # Check for duplicate email
    for u in users_db.list_all():
        if u.get("email") == body.email:
            raise HTTPException(status_code=409, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now().isoformat()

    user_data = {
        "user_id": user_id,
        "email": body.email,
        "password_hash": hash_password(body.password),
        "display_name": body.display_name,
        "role": body.role.value,
        "is_active": True,
        "created_at": now,
    }
    users_db.set(user_id, user_data)

    logger.info(
        "Admin invited user",
        extra={
            "admin_id": current_user["user_id"],
            "invited_user_id": user_id,
            "email": body.email,
            "role": body.role.value,
        },
    )

    return UserResponse(
        user_id=user_id,
        email=body.email,
        display_name=body.display_name,
        role=body.role,
        is_active=True,
        created_at=now,
    )


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, body: UserUpdate, current_user: dict = Depends(require_admin)):
    """Update a user's role or active status (admin only)."""
    user = users_db.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent demoting the last admin
    if body.role and body.role != UserRole.ADMIN and user["role"] == UserRole.ADMIN.value:
        admin_count = sum(1 for u in users_db.list_all() if u.get("role") == UserRole.ADMIN.value)
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot remove the last admin")

    # Prevent deactivating the last admin
    if body.is_active is False and user["role"] == UserRole.ADMIN.value:
        active_admins = sum(
            1 for u in users_db.list_all()
            if u.get("role") == UserRole.ADMIN.value and u.get("is_active", True)
        )
        if active_admins <= 1:
            raise HTTPException(status_code=400, detail="Cannot deactivate the last admin")

    # Apply updates
    if body.role is not None:
        user["role"] = body.role.value
    if body.is_active is not None:
        user["is_active"] = body.is_active
    if body.display_name is not None:
        user["display_name"] = body.display_name

    users_db.set(user_id, user)

    logger.info(
        "Admin updated user",
        extra={"admin_id": current_user["user_id"], "updated_user_id": user_id},
    )

    return UserResponse(
        user_id=user["user_id"],
        email=user["email"],
        display_name=user["display_name"],
        role=user["role"],
        is_active=user["is_active"],
        created_at=user["created_at"],
    )


# --- Settings Management ---

@router.get("/settings")
async def get_settings(current_user: dict = Depends(require_admin)):
    """Get app settings (admin only)."""
    notif = settings_db.get(NOTIFICATION_SETTINGS_KEY)
    return {
        "notifications": notif or {
            "email_enabled": False,
            "email_recipients": [],
            "teams_enabled": False,
            "teams_webhook_url": "",
        }
    }


@router.put("/settings/notifications")
async def update_notification_settings(body: dict, current_user: dict = Depends(require_admin)):
    """Update notification settings (admin only)."""
    settings_db.set(NOTIFICATION_SETTINGS_KEY, body)
    logger.info("Admin updated notification settings", extra={"admin_id": current_user["user_id"]})
    return {"message": "Settings updated", "notifications": body}


# --- Invite Code Management ---

@router.get("/settings/invite-code")
async def get_invite_code(current_user: dict = Depends(require_admin)):
    """Get current invite code (admin only)."""
    stored = settings_db.get(INVITE_CODE_KEY)
    return {
        "code": stored.get("code", "") if stored else "",
        "enabled": bool(stored and stored.get("code")),
    }


@router.put("/settings/invite-code")
async def update_invite_code(body: dict, current_user: dict = Depends(require_admin)):
    """Set or clear the invite code (admin only).

    - ``{"code": "my-secret"}`` → enable invite code
    - ``{"code": ""}`` → disable (open registration)
    """
    code = body.get("code", "").strip()
    settings_db.set(INVITE_CODE_KEY, {"code": code})
    logger.info(
        "Admin updated invite code",
        extra={"admin_id": current_user["user_id"], "enabled": bool(code)},
    )
    return {
        "code": code,
        "enabled": bool(code),
    }


# --- API Key Management ---

@router.get("/settings/api-keys", response_model=ApiKeysResponse)
async def get_api_keys(current_user: dict = Depends(require_admin)):
    """Get masked API key values and their sources (admin only)."""
    return get_masked_keys()


@router.put("/settings/api-keys", response_model=ApiKeysResponse)
async def update_api_keys(body: ApiKeysUpdate, current_user: dict = Depends(require_admin)):
    """Update stored API keys (admin only).

    - ``null`` field → leave unchanged
    - empty string ``""`` → remove stored key (revert to env var)
    - non-empty string → encrypt and store
    """
    save_keys(body.model_dump())
    logger.info("Admin updated API keys", extra={"admin_id": current_user["user_id"]})
    return get_masked_keys()
