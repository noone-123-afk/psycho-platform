import html
import math
import os
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any

import pdfkit


TRAIT_LABELS = {
    "ar": {
        "openness_score": "الانفتاح على التجربة",
        "conscientiousness_score": "اليقظة والضمير الحي",
        "extraversion_score": "الانبساطية",
        "agreeableness_score": "الموافقة والقبول",
        "neuroticism_score": "العصابية والانفعال",
    },
    "en": {
        "openness_score": "Openness",
        "conscientiousness_score": "Conscientiousness",
        "extraversion_score": "Extraversion",
        "agreeableness_score": "Agreeableness",
        "neuroticism_score": "Neuroticism",
    },
}


PDF_TEXT = {
    "ar": {
        "missing": "غير متوفر",
        "no_scores": "لا تتوفر درجات شخصية محفوظة لهذا التقرير.",
        "no_strengths": "لم تُسجل نقاط قوة لهذا التقرير.",
        "issued": "تاريخ الإصدار",
        "title": "تقرير التأمل الذاتي",
        "intro_title": "مقدمة",
        "intro": "مرحباً {name}. يعرض هذا التقرير ملخصاً وصفياً للبيانات التي أُدخلت، لمساندة التأمل والتطوير الذاتي.",
        "age": "العمر المسجل",
        "traits_title": "ملخص السمات الخمس",
        "traits_note": "الدرجات أدناه تلخيص حسابي للإجابات المسجلة، وليست قياساً معيارياً أو تشخيصاً نفسياً.",
        "strengths_title": "نقاط القوة المسجلة",
        "strengths_note": "العناصر التالية مما سُجل في بيانات التقييم، ولا تمثل نتيجة معتمدة من مقياس VIA ما لم يتم التحقق من الأداة المستخدمة.",
        "unnamed_strength": "قوة غير مسماة",
        "disclaimer_title": "تنبيه طبي",
        "disclaimer": "هذا التقرير مخصص للتطوير الذاتي والفهم الشخصي، وليس بديلاً عن التشخيص أو الرعاية النفسية السريرية، ولا يُستخدم لتشخيص اضطراب. عند المعاناة من ضيق شديد، يرجى التواصل مع مختص صحي مرخص أو خدمات الطوارئ المحلية.",
        "footer": "تقرير وصفي مولد من البيانات المقدمة. لا يمثل حكماً ثابتاً على الشخص.",
        "font": '"Tajawal", "Noto Naskh Arabic", "Noto Sans Arabic", Arial, sans-serif',
    },
    "en": {
        "missing": "Not provided",
        "no_scores": "No personality scores are available for this report.",
        "no_strengths": "No strengths have been recorded for this report.",
        "issued": "Issued",
        "title": "Self-Reflection Report",
        "intro_title": "Introduction",
        "intro": "Welcome, {name}. This report provides a descriptive summary of the information submitted to support self-reflection and personal development.",
        "age": "Age provided",
        "traits_title": "Big Five Summary",
        "traits_note": "The scores below are arithmetic summaries of submitted responses, not standardized measurements or psychological diagnoses.",
        "strengths_title": "Recorded Strengths",
        "strengths_note": "These items were recorded in the assessment data. They are not validated VIA results unless the instrument used has been verified.",
        "unnamed_strength": "Unnamed strength",
        "disclaimer_title": "Health Disclaimer",
        "disclaimer": "This report is for self-development and personal understanding only. It is not a substitute for clinical diagnosis or mental health care and must not be used to diagnose a disorder. If you are experiencing severe distress, contact a licensed health professional or local emergency services.",
        "footer": "A descriptive report generated from submitted data. It is not a fixed judgment of a person.",
        "font": '"Inter", Arial, sans-serif',
    },
}


def _escape_text(value: Any, fallback: str = "غير متوفر") -> str:
    if value is None:
        value = fallback
    return html.escape(str(value), quote=True)


def _validated_score(value: Any, field: str) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float, Decimal)):
        raise ValueError(f"{field} must be a number between 0 and 100")
    numeric_value = float(value)
    if not math.isfinite(numeric_value) or not 0 <= numeric_value <= 100:
        raise ValueError(f"{field} must be a finite number between 0 and 100")
    return numeric_value


def _score_section(personality: dict[str, Any], lang: str) -> str:
    rows = []
    for field, label in TRAIT_LABELS[lang].items():
        score = _validated_score(personality.get(field), field)
        if score is None:
            continue
        formatted_score = f"{score:g}"
        rows.append(
            f"""
            <div class="score-row">
                <div class="score-label">
                    <span>{label}</span>
                    <span>{formatted_score}%</span>
                </div>
                <div class="score-bar" role="img"
                     aria-label="{label}: {formatted_score}%">
                    <div class="score-fill" style="width: {formatted_score}%"></div>
                </div>
            </div>
            """
        )

    if not rows:
        return f"<p>{PDF_TEXT[lang]['no_scores']}</p>"
    return "\n".join(rows)


def _strengths_section(strengths: dict[str, Any], lang: str) -> str:
    raw_strengths = strengths.get("top_5_strengths", [])
    if not isinstance(raw_strengths, list):
        raise ValueError("strengths.top_5_strengths must be a list")

    items = [
        f"<li><bdi>{_escape_text(strength, PDF_TEXT[lang]['unnamed_strength'])}</bdi></li>"
        for strength in raw_strengths[:5]
    ]
    if not items:
        return f"<p>{PDF_TEXT[lang]['no_strengths']}</p>"
    return f"<ul>{''.join(items)}</ul>"


def _build_html(user_data: dict[str, Any], lang: str = "ar") -> str:
    if lang not in PDF_TEXT:
        raise ValueError("lang must be 'ar' or 'en'")
    text = PDF_TEXT[lang]
    direction = "rtl" if lang == "ar" else "ltr"
    text_align = "right" if lang == "ar" else "left"
    name = _escape_text(
        user_data.get("full_name"),
        "عزيزي المستخدم" if lang == "ar" else "User",
    )
    demographics = user_data.get("demographics") or {}
    personality = user_data.get("personality") or {}
    strengths = user_data.get("strengths") or {}
    if not isinstance(demographics, dict):
        raise ValueError("demographics must be an object")
    if not isinstance(personality, dict):
        raise ValueError("personality must be an object")
    if not isinstance(strengths, dict):
        raise ValueError("strengths must be an object")

    age = demographics.get("age")
    age_text = (
        f"<p><strong>{text['age']}:</strong> {_escape_text(age, text['missing'])}</p>"
        if age is not None
        else ""
    )
    issued_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    strengths_html = _strengths_section(strengths, lang)
    scores_html = _score_section(personality, lang)

    return f"""<!doctype html>
<html lang="{lang}" dir="{direction}">
<head>
    <meta charset="UTF-8">
    <title>{text['title']}</title>
    <link rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&amp;family=Tajawal:wght@400;700&amp;display=swap">
    <style>
        * {{ box-sizing: border-box; }}
        body {{
            direction: {direction};
            font-family: {text['font']};
            line-height: 1.9;
            color: #263238;
            padding: 28px;
            font-size: 13px;
            text-align: {text_align};
        }}
        h1 {{ color: #1d4ed8; text-align: center; margin-bottom: 4px; }}
        h2 {{ color: #1e40af; margin-top: 0; font-size: 18px; }}
        .issued {{ text-align: center; color: #64748b; margin-bottom: 28px; }}
        .section {{
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 18px;
            border-{text_align}: 4px solid #2563eb;
            page-break-inside: avoid;
        }}
        .score-row {{ margin: 14px 0; }}
        .score-label {{ display: flex; justify-content: space-between; }}
        .score-bar {{
            background: #e2e8f0;
            height: 10px;
            border-radius: 5px;
            margin-top: 5px;
            direction: ltr;
        }}
        .score-fill {{ background: #2563eb; height: 100%; border-radius: 5px; }}
        .notice {{
            border-{text_align}-color: #b45309;
            background: #fffbeb;
        }}
        .footer {{
            text-align: center;
            margin-top: 36px;
            font-size: 11px;
            color: #64748b;
        }}
    </style>
</head>
<body>
    <h1>{text['title']}</h1>
    <p class="issued">{text['issued']}: {issued_date}</p>

    <section class="section">
        <h2>{text['intro_title']}</h2>
        <p>{text['intro'].format(name=f'<bdi>{name}</bdi>')}</p>
        {age_text}
    </section>

    <section class="section">
        <h2>{text['traits_title']}</h2>
        <p>{text['traits_note']}</p>
        {scores_html}
    </section>

    <section class="section">
        <h2>{text['strengths_title']}</h2>
        <p>{text['strengths_note']}</p>
        {strengths_html}
    </section>

    <section class="section notice">
        <h2>{text['disclaimer_title']}</h2>
        <p>{text['disclaimer']}</p>
    </section>

    <footer class="footer">
        <p>{text['footer']}</p>
    </footer>
</body>
</html>"""


def generate_book_pdf(
    user_data: dict[str, Any], output_path: str, lang: str = "ar"
) -> str:
    """Generate an Arabic RTL or English LTR self-reflection PDF."""
    if not isinstance(user_data, dict):
        raise ValueError("user_data must be an object")
    if not output_path or not output_path.strip():
        raise ValueError("output_path must not be empty")
    if lang not in PDF_TEXT:
        raise ValueError("lang must be 'ar' or 'en'")

    destination = Path(output_path).expanduser().resolve()
    destination.parent.mkdir(parents=True, exist_ok=True)

    wkhtmltopdf_path = os.getenv("WKHTMLTOPDF_PATH")
    configuration = (
        pdfkit.configuration(wkhtmltopdf=wkhtmltopdf_path)
        if wkhtmltopdf_path
        else pdfkit.configuration()
    )
    options = {
        "page-size": "A4",
        "encoding": "UTF-8",
        "margin-top": "18mm",
        "margin-right": "16mm",
        "margin-bottom": "18mm",
        "margin-left": "16mm",
        "no-outline": None,
        "quiet": None,
    }

    pdfkit.from_string(
        _build_html(user_data, lang),
        str(destination),
        options=options,
        configuration=configuration,
    )
    if not destination.is_file() or destination.stat().st_size == 0:
        raise RuntimeError("PDF generation did not produce a readable file")
    return str(destination)
