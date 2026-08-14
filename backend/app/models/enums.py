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


class ResourceType(str, enum.Enum):
    link = "link"
    note = "note"


class DigestFrequency(str, enum.Enum):
    off = "off"
    weekly = "weekly"
    monthly = "monthly"
