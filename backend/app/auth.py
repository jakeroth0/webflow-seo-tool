import json
import logging
import uuid
from datetime import datetime
from typing import Optional

import bcrypt
from jose import jwt
from fastapi import Cookie, Depends, Header, HTTPException, Response

from app.config import settings
from app.storage import redis_client
from app.models.user import UserRole

logger = logging.getLogger(__name__)

SESSION_PREFIX = "session"
SESSION_ALGORITHM = "HS256"


# --- Password hashing ---

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


# --- Session management ---

def create_session(user_id: str, role: str, email: str) -> str:
    """Create a session in Redis and return a signed session ID."""
    session_id = str(uuid.uuid4())

    # Store session data in Redis with TTL
    session_data = {
        "user_id": user_id,
        "role": role,
        "email": email,
        "created_at": datetime.now().isoformat(),
    }
    redis_client.setex(
        f"{SESSION_PREFIX}:{session_id}",
        settings.session_ttl_seconds,
        json.dumps(session_data),
    )

    # Sign the session ID so clients can't forge one
    signed = jwt.encode(
        {"session_id": session_id},
        settings.session_secret_key,
        algorithm=SESSION_ALGORITHM,
    )
    return signed


def get_session(signed_id: str) -> Optional[dict]:
    """Verify signed session ID and return session data from Redis."""
    try:
        payload = jwt.decode(
            signed_id,
            settings.session_secret_key,
            algorithms=[SESSION_ALGORITHM],
        )
        session_id = payload["session_id"]
    except Exception:
        return None

    raw = redis_client.get(f"{SESSION_PREFIX}:{session_id}")
    if raw is None:
        return None
    return json.loads(raw)


def delete_session(signed_id: str) -> None:
    """Delete a session from Redis."""
    try:
        payload = jwt.decode(
            signed_id,
            settings.session_secret_key,
            algorithms=[SESSION_ALGORITHM],
        )
        session_id = payload["session_id"]
        redis_client.delete(f"{SESSION_PREFIX}:{session_id}")
    except Exception:
        pass


def set_session_cookie(response: Response, signed_id: str) -> None:
    """Set the session cookie on the response."""
    is_prod = settings.environment == "production"
    response.set_cookie(
        key="session_id",
        value=signed_id,
        httponly=True,
        secure=is_prod,
        samesite="none" if is_prod else "lax",
        max_age=settings.session_ttl_seconds,
    )


def clear_session_cookie(response: Response) -> None:
    """Remove the session cookie."""
    is_prod = settings.environment == "production"
    response.delete_cookie(
        key="session_id",
        secure=is_prod,
        samesite="none" if is_prod else "lax",
    )


# --- FastAPI dependencies ---

def get_current_user(
    session_id: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
) -> dict:
    """Dependency: extract and validate the current user from Authorization header or session cookie."""
    # Prefer Authorization header (works on all browsers including mobile Safari)
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
    elif session_id:
        token = session_id

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = get_session(token)
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or invalid")

    return session


def require_role(required_role: UserRole):
    """Dependency factory: require a specific role."""
    def _check(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") != required_role.value:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return _check


require_admin = require_role(UserRole.ADMIN)
