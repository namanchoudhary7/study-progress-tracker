from app.models.enums import ReviewOutcome

MAX_INTERVAL_DAYS = 90


def compute_next_interval(current_interval: int, outcome: ReviewOutcome) -> int:
    if outcome == ReviewOutcome.again:
        return 1
    multiplier = 2.0 if outcome == ReviewOutcome.good else 2.5
    return min(round(current_interval * multiplier), MAX_INTERVAL_DAYS)
