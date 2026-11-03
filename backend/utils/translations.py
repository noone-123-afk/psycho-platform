TRANSLATIONS = {
    "ar": {
        "no_active_session": "لا توجد جلسة تقييم نشطة",
        "consent_updated": "تم تحديث الموافقة",
        "demographics_saved": "تم حفظ البيانات الشخصية",
        "personality_saved": "تم حفظ نتائج الشخصية",
        "crisis_detected": (
            "إجابتك أشارت إلى أمر يستحق الانتباه، لكن هذا الفحص لا يستطيع "
            "تقييم مستوى الخطر. إذا كنت في خطر فوري، اتصل بالطوارئ المحلية "
            "أو تواصل مع شخص تثق به أو مختص صحي مرخص."
        ),
        "screening_saved": "تم حفظ الفحص الصحي",
    },
    "en": {
        "no_active_session": "No active assessment session",
        "consent_updated": "Consent updated successfully",
        "demographics_saved": "Demographics saved successfully",
        "personality_saved": "Personality assessment saved",
        "crisis_detected": (
            "Your response raised a signal that may need attention, but this "
            "screen cannot assess risk. If you are in immediate danger, "
            "contact local emergency services or someone you trust or a "
            "licensed health professional."
        ),
        "screening_saved": "Health screening saved",
    },
}


def get_text(key: str, lang: str = "ar") -> str:
    return TRANSLATIONS.get(lang, TRANSLATIONS["ar"]).get(key, key)
