import logging

import resend

from app.core.config import settings
from app.core.security import create_email_verification_token

logger = logging.getLogger(__name__)

resend.api_key = settings.resend_api_key


def send_email(to: str, subject: str, html: str) -> None:
    """Send an email via Resend. No-ops (with a warning) if no API key is configured,
    so local dev and tests never fail signup/profile updates over a missing email setup."""
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not set — skipping email to %s: %s", to, subject)
        return
    try:
        resend.Emails.send({"from": settings.email_from, "to": [to], "subject": subject, "html": html})
    except Exception:
        logger.exception("Failed to send email to %s", to)


def send_verification_email(user_id: int, email: str) -> None:
    token = create_email_verification_token(user_id)
    link = f"{settings.frontend_url}/verify-email?token={token}"
    send_email(
        email,
        "Verify your email",
        f'<p>Click to verify your Study Tracker email:</p><p><a href="{link}">{link}</a></p>',
    )


def send_digest_email(email: str, period_label: str, topics_done: int, total_minutes: int, current_streak: int) -> None:
    send_email(
        email,
        f"Your {period_label} study digest",
        (
            f"<p>Here's your {period_label} recap:</p>"
            f"<ul>"
            f"<li>{topics_done} topic(s) completed</li>"
            f"<li>{total_minutes} minute(s) studied</li>"
            f"<li>Current streak: {current_streak} day(s)</li>"
            f"</ul>"
            f'<p><a href="{settings.frontend_url}/dashboard">Open your dashboard</a></p>'
        ),
    )
