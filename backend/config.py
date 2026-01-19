import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # LLM
    LLM_API_KEY = os.getenv("LLM_API_KEY")
    LLM_BASE_URL = os.getenv("LLM_BASE_URL")
    LLM_MODEL = os.getenv("LLM_MODEL", "gemini-1.5-pro")

    # Profile / Intent
    PROFILE_KEY = os.getenv("PROFILE_LLM_KEY")
    PROFILE_BASE = os.getenv("PROFILE_LLM_BASE")

    # SiliconFlow (TTS/STT)
    SILICON_KEY = os.getenv("SILICON_API_KEY")
    SILICON_BASE = os.getenv("SILICON_BASE_URL")
    TTS_MODEL = os.getenv("TTS_MODEL")
    TTS_VOICE = os.getenv("TTS_VOICE")
    STT_MODEL = os.getenv("STT_MODEL", "FunAudioLLM/SenseVoiceSmall")

    # Proxy
    PROXY = os.getenv("PROXY_URL")