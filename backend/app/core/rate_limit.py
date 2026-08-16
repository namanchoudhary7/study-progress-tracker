"""A small in-memory sliding-window rate limiter.

Single-process only, matching the `_pending_confirmations` store in
app.routers.agent — fine at this app's current scale (single uvicorn worker,
no Redis), but would need to move to a shared store for a multi-worker deploy.
"""

import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[int, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: int) -> None:
        now = time.time()
        with self._lock:
            hits = self._hits[key]
            cutoff = now - self.window_seconds
            while hits and hits[0] < cutoff:
                hits.popleft()

            if len(hits) >= self.max_requests:
                retry_after = max(1, int(hits[0] + self.window_seconds - now) + 1)
                raise HTTPException(
                    status_code=429,
                    detail="Too many requests to the study coach. Please slow down and try again shortly.",
                    headers={"Retry-After": str(retry_after)},
                )

            hits.append(now)
