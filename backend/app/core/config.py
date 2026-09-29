from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "Dhanova Backend"
    VERSION: str = "1.0.0"

    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # External APIs
    GEMINI_API_KEY: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
