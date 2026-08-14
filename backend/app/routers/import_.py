import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.enums import TopicStatus
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.user import User
from app.schemas.import_ import ImportCsvRequest, ImportResult

router = APIRouter(prefix="/import", tags=["import"])

REQUIRED_COLUMNS = {"subject", "topic"}


@router.post("/csv", response_model=ImportResult)
def import_csv(
    payload: ImportCsvRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> ImportResult:
    reader = csv.DictReader(io.StringIO(payload.csv_text))
    fieldnames = {(name or "").strip().lower() for name in (reader.fieldnames or [])}
    if not REQUIRED_COLUMNS.issubset(fieldnames):
        raise HTTPException(status_code=400, detail="CSV must have 'subject' and 'topic' columns")

    existing_subjects = {
        s.name: s for s in db.scalars(select(Subject).where(Subject.user_id == current_user.id))
    }
    existing_topic_keys = {
        (subject_id, name)
        for subject_id, name in db.execute(
            select(Topic.subject_id, Topic.name).where(Topic.user_id == current_user.id)
        ).all()
    }
    order_counters: dict[int, int] = {}

    rows_processed = 0
    subjects_created = 0
    topics_created = 0
    topics_skipped = 0

    for row_num, row in enumerate(reader, start=2):
        subject_name = (row.get("subject") or "").strip()
        topic_name = (row.get("topic") or "").strip()
        if not subject_name or not topic_name:
            continue
        rows_processed += 1

        status_raw = (row.get("status") or "").strip().lower()
        if status_raw and status_raw not in TopicStatus.__members__:
            raise HTTPException(status_code=400, detail=f"Row {row_num}: invalid status '{status_raw}'")
        status = TopicStatus(status_raw) if status_raw else TopicStatus.todo

        subject = existing_subjects.get(subject_name)
        if subject is None:
            subject = Subject(user_id=current_user.id, name=subject_name)
            db.add(subject)
            db.flush()
            existing_subjects[subject_name] = subject
            subjects_created += 1

        key = (subject.id, topic_name)
        if key in existing_topic_keys:
            topics_skipped += 1
            continue

        if subject.id not in order_counters:
            order_counters[subject.id] = (
                db.scalar(
                    select(func.coalesce(func.max(Topic.order_index), -1) + 1).where(Topic.subject_id == subject.id)
                )
                or 0
            )

        topic = Topic(
            subject_id=subject.id,
            user_id=current_user.id,
            name=topic_name,
            status=status,
            order_index=order_counters[subject.id],
        )
        order_counters[subject.id] += 1
        db.add(topic)
        existing_topic_keys.add(key)
        topics_created += 1

    db.commit()

    return ImportResult(
        rows_processed=rows_processed,
        subjects_created=subjects_created,
        topics_created=topics_created,
        topics_skipped=topics_skipped,
    )
