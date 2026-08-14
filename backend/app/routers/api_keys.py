from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agent_tools import api_keys as tools
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.api_key import ApiKey
from app.models.user import User
from app.schemas.api_key import ApiKeyCreate, ApiKeyCreated, ApiKeyRead

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


@router.get("", response_model=list[ApiKeyRead])
def list_api_keys(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[ApiKey]:
    return tools.list_api_keys(db, current_user)


@router.post("", response_model=ApiKeyCreated, status_code=201)
def create_api_key(
    payload: ApiKeyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> ApiKeyCreated:
    api_key, secret = tools.create_api_key(db, current_user, payload.name)
    return ApiKeyCreated(**ApiKeyRead.model_validate(api_key).model_dump(), key=secret)


@router.delete("/{api_key_id}", status_code=204)
def delete_api_key(
    api_key_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> None:
    tools.delete_api_key(db, current_user, api_key_id)
