import enum


class TopicStatus(str, enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


class GoalStatus(str, enum.Enum):
    open = "open"
    completed = "completed"
    missed = "missed"


class ReviewOutcome(str, enum.Enum):
    again = "again"
    good = "good"
    easy = "easy"
