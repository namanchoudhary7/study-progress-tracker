from datetime import date, timedelta

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.enums import GoalStatus, TopicStatus
from app.models.goal import Goal
from app.models.review import ReviewSchedule
from app.models.study_session import StudySession
from app.models.subject import Subject
from app.models.topic import Topic
from app.schemas.stats import (
    CompletionItem,
    OverdueGoal,
    OverdueSummary,
    OverviewStats,
    StreakStats,
    TimeSpentPoint,
)


def get_overview(db: Session) -> OverviewStats:
    total_subjects = db.scalar(select(func.count()).select_from(Subject)) or 0
    total_topics = db.scalar(select(func.count()).select_from(Topic)) or 0
    topics_done = db.scalar(select(func.count()).where(Topic.status == TopicStatus.done)) or 0
    total_minutes = db.scalar(select(func.coalesce(func.sum(StudySession.duration_minutes), 0))) or 0
    completion_pct = round((topics_done / total_topics) * 100, 1) if total_topics else 0.0

    return OverviewStats(
        total_subjects=total_subjects,
        total_topics=total_topics,
        topics_done=topics_done,
        completion_pct=completion_pct,
        total_minutes=total_minutes,
    )


def get_completion(db: Session) -> list[CompletionItem]:
    rows = db.execute(
        select(
            Subject.id,
            Subject.name,
            func.count(Topic.id),
            func.sum(case((Topic.status == TopicStatus.done, 1), else_=0)),
        )
        .outerjoin(Topic, Topic.subject_id == Subject.id)
        .group_by(Subject.id, Subject.name)
        .order_by(Subject.name)
    ).all()

    items = []
    for subject_id, name, total, done in rows:
        total = total or 0
        done = done or 0
        pct = round((done / total) * 100, 1) if total else 0.0
        items.append(
            CompletionItem(subject_id=subject_id, subject_name=name, total_topics=total, done_topics=done, completion_pct=pct)
        )
    return items


def get_time_spent(
    db: Session, date_from: date | None, date_to: date | None, group_by: str
) -> list[TimeSpentPoint]:
    stmt = select(StudySession)
    if date_from is not None:
        stmt = stmt.where(StudySession.session_date >= date_from)
    if date_to is not None:
        stmt = stmt.where(StudySession.session_date <= date_to)
    sessions = list(db.scalars(stmt))

    buckets: dict[str, int] = {}
    if group_by == "subject":
        subject_names = {s.id: s.name for s in db.scalars(select(Subject))}
        for s in sessions:
            key = subject_names.get(s.subject_id, "Unknown")
            buckets[key] = buckets.get(key, 0) + s.duration_minutes
        return [TimeSpentPoint(label=k, minutes=v) for k, v in sorted(buckets.items())]

    for s in sessions:
        if group_by == "week":
            key = s.session_date.isocalendar()
            label = f"{key[0]}-W{key[1]:02d}"
        else:
            label = s.session_date.isoformat()
        buckets[label] = buckets.get(label, 0) + s.duration_minutes

    return [TimeSpentPoint(label=k, minutes=v) for k, v in sorted(buckets.items())]


def get_streaks(db: Session) -> StreakStats:
    distinct_dates = sorted(set(db.scalars(select(StudySession.session_date))))
    if not distinct_dates:
        return StreakStats(current_streak=0, longest_streak=0)

    longest = 1
    run = 1
    for prev, curr in zip(distinct_dates, distinct_dates[1:]):
        if curr - prev == timedelta(days=1):
            run += 1
            longest = max(longest, run)
        else:
            run = 1

    today = date.today()
    date_set = set(distinct_dates)
    if today in date_set:
        cursor = today
    elif today - timedelta(days=1) in date_set:
        cursor = today - timedelta(days=1)
    else:
        return StreakStats(current_streak=0, longest_streak=longest)

    current = 0
    while cursor in date_set:
        current += 1
        cursor -= timedelta(days=1)

    return StreakStats(current_streak=current, longest_streak=longest)


def get_overdue(db: Session) -> OverdueSummary:
    today = date.today()
    overdue_goals = list(
        db.scalars(
            select(Goal).where(Goal.status == GoalStatus.open, Goal.target_date < today).order_by(Goal.target_date)
        )
    )
    due_reviews_count = db.scalar(
        select(func.count()).select_from(ReviewSchedule).where(ReviewSchedule.next_review_date <= today)
    ) or 0

    return OverdueSummary(
        overdue_goals=[OverdueGoal(id=g.id, title=g.title, target_date=g.target_date) for g in overdue_goals],
        due_reviews_count=due_reviews_count,
    )
