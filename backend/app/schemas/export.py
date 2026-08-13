from pydantic import BaseModel

from app.schemas.goal import GoalRead
from app.schemas.review import ReviewLogRead, ReviewScheduleRead
from app.schemas.study_session import StudySessionRead
from app.schemas.subject import SubjectRead
from app.schemas.topic import TopicRead


class ExportData(BaseModel):
    subjects: list[SubjectRead]
    topics: list[TopicRead]
    study_sessions: list[StudySessionRead]
    goals: list[GoalRead]
    review_schedules: list[ReviewScheduleRead]
    review_logs: list[ReviewLogRead]
