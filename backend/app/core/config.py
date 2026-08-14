from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://tracker:tracker@localhost:5432/study_tracker"
    cors_origins: str = "http://localhost:5173"
    environment: str = "development"

    jwt_secret: str = "dev-only-insecure-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"
    frontend_url: str = "http://localhost:5173"

    resend_api_key: str = ""
    email_from: str = "Study Tracker <onboarding@resend.dev>"

    internal_api_secret: str = ""

    anthropic_api_key: str = ""
    openai_api_key: str = ""
    gemini_api_key: str = ""
    llm_provider_priority: str = "gemini"
    gemini_model_priority: str = (
        "gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash,gemini-2.5-flash,"
        "gemini-3.5-flash-lite,gemini-2.5-flash-lite"
    )

    @property
    def llm_provider_priority_list(self) -> list[str]:
        return [p.strip() for p in self.llm_provider_priority.split(",") if p.strip()]

    @property
    def gemini_model_priority_list(self) -> list[str]:
        return [m.strip() for m in self.gemini_model_priority.split(",") if m.strip()]

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


settings = Settings()
