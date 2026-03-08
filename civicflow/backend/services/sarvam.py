import os
from sarvamai import SarvamAI

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = SarvamAI(api_subscription_key=SARVAM_API_KEY)
    return _client


def chat_completion(messages: list, system_prompt: str = "") -> str:
    """Call Sarvam LLM (sarvam-m) for agent reasoning."""
    client = _get_client()
    full_messages = []
    if system_prompt:
        full_messages.append({"role": "system", "content": system_prompt})
    full_messages.extend(messages)
    response = client.chat.completions(
        messages=full_messages,
        model="sarvam-m",
        reasoning_effort=None,   # disable chain-of-thought — we don't want <think> in output
    )
    return response.choices[0].message.content or ""


def transcribe_audio(audio_bytes: bytes, language: str = "hi-IN") -> str:
    raise NotImplementedError


def text_to_speech(text: str, language: str = "hi-IN") -> bytes:
    raise NotImplementedError


def translate(text: str, source_lang: str, target_lang: str = "en-IN") -> str:
    raise NotImplementedError
