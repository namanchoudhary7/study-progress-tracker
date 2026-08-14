from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.resource import Resource
from app.models.topic import Topic
from app.models.user import User
from app.schemas.resource import ResourceCreate, ResourceRead, ResourceUpdate

router = APIRouter(tags=["resources"])


def _get_owned_topic(db: Session, topic_id: int, current_user: User) -> Topic:
    topic = db.scalar(select(Topic).where(Topic.id == topic_id, Topic.user_id == current_user.id))
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


def _get_resource_or_404(db: Session, resource_id: int, current_user: User) -> Resource:
    resource = db.scalar(select(Resource).where(Resource.id == resource_id, Resource.user_id == current_user.id))
    if resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource


@router.get("/topics/{topic_id}/resources", response_model=list[ResourceRead])
def list_resources(
    topic_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[Resource]:
    _get_owned_topic(db, topic_id, current_user)
    return list(
        db.scalars(
            select(Resource).where(Resource.topic_id == topic_id).order_by(Resource.created_at)
        )
    )


@router.post("/topics/{topic_id}/resources", response_model=ResourceRead, status_code=201)
def create_resource(
    topic_id: int,
    payload: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Resource:
    _get_owned_topic(db, topic_id, current_user)
    resource = Resource(**payload.model_dump(), topic_id=topic_id, user_id=current_user.id)
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


@router.patch("/resources/{resource_id}", response_model=ResourceRead)
def update_resource(
    resource_id: int,
    payload: ResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Resource:
    resource = _get_resource_or_404(db, resource_id, current_user)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(resource, field, value)
    db.commit()
    db.refresh(resource)
    return resource


@router.delete("/resources/{resource_id}", status_code=204)
def delete_resource(
    resource_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> None:
    resource = _get_resource_or_404(db, resource_id, current_user)
    db.delete(resource)
    db.commit()
