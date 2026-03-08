from datetime import datetime, timezone

SUPPORTED_LANGUAGES = {"en", "hi", "ta", "te", "kn", "ml"}


def user_schema(
    name: str,
    email: str,
    phone: str,
    password_hash: str,
    preferred_language: str = "en",
) -> dict:
    return {
        "name": name,
        "email": email,
        "phone": phone,
        "password_hash": password_hash,
        "preferred_language": preferred_language,
        "created_at": datetime.now(timezone.utc),
    }
