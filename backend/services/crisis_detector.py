import re
import unicodedata
from typing import Any


CRISIS_PHRASES = {
    "ar": {
        "suicide_or_death_thoughts": (
            "انتحار",
            "أنهي حياتي",
            "أريد أن أموت",
            "أريد الموت",
            "لا أريد العيش",
            "لا فائدة من العيش",
            "أتمنى لو مت",
            "ليتني لم أولد",
            "لا أستحق العيش",
            "أنام ولا أستيقظ",
        ),
        "self_harm": (
            "أجرح نفسي",
            "أقطع نفسي",
            "أحرق نفسي",
            "أؤذي نفسي",
            "أضرب نفسي",
            "أخدش جلدي",
            "أعاقب نفسي",
        ),
        "harm_to_others": (
            "سأقتل",
            "سأؤذي",
            "سأضرب",
            "سأنتقم",
            "سأحرق",
            "سأؤذيه",
            "سأؤذيها",
        ),
        "severe_distress": (
            "لا أستطيع النهوض من السرير",
            "لا أستطيع الأكل",
            "لا أستطيع النوم",
            "لا أمل",
            "لا مخرج",
            "محاصر",
            "ميؤوس منه",
        ),
    },
    "en": {
        "suicide_or_death_thoughts": (
            "kill myself",
            "end my life",
            "want to die",
            "commit suicide",
            "no reason to live",
            "better off dead",
            "wish i was dead",
            "wish i never existed",
            "don't deserve to live",
            "sleep and never wake up",
            "no point in living",
            "can't go on",
        ),
        "self_harm": (
            "cut myself",
            "hurt myself",
            "burn myself",
            "harm myself",
            "hit myself",
            "scratch my skin",
            "punish myself",
        ),
        "harm_to_others": (
            "i will kill",
            "i will hurt",
            "i will attack",
            "i will destroy",
            "deserves to die",
            "i'll make them pay",
            "won't get away",
        ),
        "severe_distress": (
            "can't get out of bed",
            "can't eat",
            "can't sleep",
            "nothing matters",
            "no hope",
            "no way out",
            "trapped",
            "hopeless",
        ),
    },
}

SUPPORT_MESSAGES = {
    "ar": (
        "عبارتك تطابقت مع إشارة لغوية تستحق الانتباه، لكن هذا الفحص الآلي "
        "لا يستطيع معرفة السياق أو تقييم مستوى الخطر. إذا كنت في خطر فوري، "
        "اتصل بخدمات الطوارئ المحلية أو توجّه إلى أقرب قسم طوارئ، وحاول "
        "التواصل الآن مع شخص تثق به أو مختص صحي مرخص."
    ),
    "en": (
        "Your text matched a language signal that may need attention, but "
        "this automated check cannot understand context or assess risk. If "
        "you are in immediate danger, contact local emergency services or "
        "go to the nearest emergency department. Consider contacting someone "
        "you trust or a licensed health professional now."
    ),
}

NO_MATCH_MESSAGES = {
    "ar": (
        "لم تُعثر على العبارات المحددة في هذا الفحص. هذا لا يعني أن الشخص "
        "بخير أو أنه لا يحتاج إلى دعم."
    ),
    "en": (
        "No configured phrases were found. This does not establish that the "
        "person is safe or does not need support."
    ),
}

HELPLINE_MESSAGES = {
    "ar": {
        "name": "دليل للعثور على خطوط دعم محلية",
        "alternative": (
            "إذا كان هناك خطر فوري، اتصل بخدمات الطوارئ المحلية أو توجّه "
            "إلى أقرب قسم طوارئ."
        ),
    },
    "en": {
        "name": "Directory for finding local support helplines",
        "alternative": (
            "If there is immediate danger, contact local emergency services "
            "or go to the nearest emergency department."
        ),
    },
}

HELPLINE_DIRECTORY_URL = "https://findahelpline.com/"
MAX_TEXT_LENGTH = 50_000
ARABIC_DIACRITICS = re.compile(r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]")
ARABIC_TRANSLATION = str.maketrans(
    {
        "أ": "ا",
        "إ": "ا",
        "آ": "ا",
        "ٱ": "ا",
        "ى": "ي",
        "ؤ": "و",
        "ئ": "ي",
        "ـ": "",
    }
)


def _normalize(text: str, lang: str) -> str:
    normalized = unicodedata.normalize("NFKC", text).casefold()
    if lang == "ar":
        normalized = ARABIC_DIACRITICS.sub("", normalized)
        normalized = normalized.translate(ARABIC_TRANSLATION)
    return re.sub(r"\s+", " ", normalized).strip()


def detect_crisis(text: str, lang: str = "ar") -> dict[str, Any]:
    """Find configured language signals; this is not a clinical risk assessment."""
    if lang not in CRISIS_PHRASES:
        raise ValueError("lang must be 'ar' or 'en'")
    if not isinstance(text, str):
        raise TypeError("text must be a string")
    if len(text) > MAX_TEXT_LENGTH:
        raise ValueError(f"text must not exceed {MAX_TEXT_LENGTH} characters")

    normalized_text = _normalize(text, lang)
    categories = [
        category
        for category, phrases in CRISIS_PHRASES[lang].items()
        if any(_normalize(phrase, lang) in normalized_text for phrase in phrases)
    ]
    signal_found = bool(categories)

    return {
        "potential_signal": signal_found,
        "categories": categories,
        "message": (
            SUPPORT_MESSAGES[lang] if signal_found else NO_MATCH_MESSAGES[lang]
        ),
        "is_clinical_assessment": False,
        "context_review_required": signal_found,
    }


def get_helpline_by_country(country_code: str, lang: str = "ar") -> dict[str, Any]:
    """Return a vetted directory, not unverified country-specific phone numbers."""
    if lang not in HELPLINE_MESSAGES:
        raise ValueError("lang must be 'ar' or 'en'")
    if not isinstance(country_code, str):
        raise TypeError("country_code must be a string")

    normalized_country = country_code.strip().upper()
    if normalized_country == "DEFAULT":
        normalized_country = ""
    elif normalized_country and not re.fullmatch(r"[A-Z]{2,3}", normalized_country):
        raise ValueError("country_code must be a 2- or 3-letter country code")

    return {
        **HELPLINE_MESSAGES[lang],
        "country_code": normalized_country or None,
        "website": HELPLINE_DIRECTORY_URL,
        "phone_number": None,
        "requires_local_verification": True,
    }
