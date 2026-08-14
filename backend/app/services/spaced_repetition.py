from app.models.enums import ReviewOutcome

MAX_INTERVAL_DAYS = 90
DEFAULT_EASE_FACTOR = 2.0


def compute_next_interval(current_interval: int, outcome: ReviewOutcome, ease_factor: float | None = None) -> int:
    if outcome == ReviewOutcome.again:
        return 1
    good_multiplier = ease_factor if ease_factor is not None else DEFAULT_EASE_FACTOR
    multiplier = good_multiplier if outcome == ReviewOutcome.good else good_multiplier + 0.5
    return min(round(current_interval * multiplier), MAX_INTERVAL_DAYS)
