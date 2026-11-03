import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from typing import Annotated, AsyncIterator, Literal
from uuid import UUID, uuid4

import asyncpg
import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field, field_validator
from starlette.concurrency import run_in_threadpool

from services.paypal_service import (
    PayPalError,
    capture_paypal_order,
    create_paypal_order,
)
from services.crisis_detector import detect_crisis, get_helpline_by_country
from services.pdf_generator import generate_book_pdf
from services.crisis_detector import detect_crisis, get_helpline_by_country
from utils.translations import get_text

load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
TOKEN_LIFETIME = timedelta(days=7)
DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:3000,http://127.0.0.1:3000"
)
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
    if origin.strip()
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL must be configured before starting the API")
    if not SECRET_KEY or len(SECRET_KEY.encode("utf-8")) < 32:
        raise RuntimeError("SECRET_KEY must be configured with at least 32 bytes")

    app.state.db_pool = await asyncpg.create_pool(DATABASE_URL)
    try:
        yield
    finally:
        await app.state.db_pool.close()


app = FastAPI(title="Personal Book API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Authorization", "Content-Type"],
)

security = HTTPBearer(auto_error=False)


async def get_db() -> AsyncIterator[asyncpg.Connection]:
    pool = getattr(app.state, "db_pool", None)
    if pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not available",
        )
    async with pool.acquire() as connection:
        yield connection


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: UUID) -> str:
    if not SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured",
        )
    expires_at = datetime.now(timezone.utc) + TOKEN_LIFETIME
    return jwt.encode(
        {"sub": str(user_id), "exp": expires_at},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(security)
    ],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
) -> asyncpg.Record:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing access token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or not SECRET_KEY:
        raise unauthorized

    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
        user_id = UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, TypeError, ValueError):
        raise unauthorized from None

    user = await db.fetchrow(
        "SELECT id, full_name, language, country_code, consent_signed FROM users "
        "WHERE id = $1 AND is_active = TRUE",
        user_id,
    )
    if user is None:
        raise unauthorized
    return user


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=72)
    full_name: str = Field(min_length=1, max_length=255)
    country_code: str = Field(min_length=2, max_length=3)

    @field_validator("password")
    @classmethod
    def validate_password_bytes(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must not exceed 72 UTF-8 bytes")
        return value


class ConsentUpdate(BaseModel):
    consent_signed: bool


class DemographicData(BaseModel):
    age: int = Field(ge=0, le=120)
    gender: str = Field(min_length=1, max_length=20)
    education_level: str = Field(min_length=1, max_length=50)
    marital_status: str = Field(min_length=1, max_length=30)
    occupation: str = Field(min_length=1, max_length=100)
    family_environment: str = Field(max_length=10000)
    social_context: str = Field(max_length=10000)
    major_life_events: str = Field(max_length=10000)
    current_challenges: str = Field(max_length=10000)
    future_aspirations: str = Field(max_length=10000)


LikertResponse = Annotated[int, Field(ge=1, le=5)]
ScreeningResponse = Annotated[int, Field(ge=0, le=3)]


class PersonalityAnswers(BaseModel):
    extraversion: list[LikertResponse] = Field(min_length=20, max_length=20)
    openness: list[LikertResponse] = Field(min_length=20, max_length=20)
    conscientiousness: list[LikertResponse] = Field(min_length=20, max_length=20)
    agreeableness: list[LikertResponse] = Field(min_length=20, max_length=20)
    neuroticism: list[LikertResponse] = Field(min_length=20, max_length=20)


class HealthScreening(BaseModel):
    phq9: list[ScreeningResponse] = Field(min_length=9, max_length=9)
    gad7: list[ScreeningResponse] = Field(min_length=7, max_length=7)


async def get_active_session(
    db: asyncpg.Connection,
    user_id: UUID,
    *,
    lock: bool = False,
    lang: str = "ar",
) -> asyncpg.Record:
    lock_clause = " FOR UPDATE" if lock else ""
    session = await db.fetchrow(
        "SELECT id FROM assessment_sessions "
        "WHERE user_id = $1 AND status = 'in_progress' "
        f"ORDER BY started_at DESC LIMIT 1{lock_clause}",
        user_id,
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=get_text("no_active_session", lang),
        )
    return session


async def require_consent(current_user: asyncpg.Record) -> None:
    if not current_user["consent_signed"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Signed consent is required before submitting assessment data",
        )


async def log_crisis_incident(
    db: asyncpg.Connection,
    *,
    user_id: UUID,
    session_id: UUID,
    categories: list[str],
    analyzed_field: str,
) -> None:
    await db.execute(
        """
        INSERT INTO crisis_incidents (
            user_id, session_id, detector_version, signal_categories,
            analyzed_field, action_taken, support_directory_shown
        ) VALUES ($1, $2, $3, $4, $5, $6, TRUE)
        """,
        user_id,
        session_id,
        "keyword-v1",
        categories,
        analyzed_field,
        "assessment_paused_support_shown",
    )


@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
async def register(
    user: UserRegister,
    db: Annotated[asyncpg.Connection, Depends(get_db)],
):
    email = str(user.email).strip().lower()
    full_name = user.full_name.strip()
    country_code = user.country_code.strip().upper()
    if not full_name:
        raise HTTPException(status_code=422, detail="Full name cannot be blank")

    try:
        async with db.transaction():
            user_id = await db.fetchval(
                """
                INSERT INTO users (email, password_hash, full_name, country_code)
                VALUES ($1, $2, $3, $4)
                RETURNING id
                """,
                email,
                hash_password(user.password),
                full_name,
                country_code,
            )
            await db.execute(
                "INSERT INTO assessment_sessions (user_id) VALUES ($1)",
                user_id,
            )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from None

    return {
        "access_token": create_access_token(user_id),
        "token_type": "bearer",
    }


@app.post("/api/assessment/consent")
async def update_consent(
    consent: ConsentUpdate,
    current_user: Annotated[asyncpg.Record, Depends(get_current_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    lang: Literal["ar", "en"] = Query("ar"),
):
    await db.execute(
        """
        UPDATE users
        SET consent_signed = $1,
            consent_date = CASE WHEN $1 THEN NOW() ELSE NULL END
        WHERE id = $2
        """,
        consent.consent_signed,
        current_user["id"],
    )
    return {
        "status": "consent updated",
        "message": get_text("consent_updated", lang),
    }


@app.post("/api/assessment/demographics")
async def save_demographics(
    data: DemographicData,
    current_user: Annotated[asyncpg.Record, Depends(get_current_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    lang: Literal["ar", "en"] = Query("ar"),
):
    await require_consent(current_user)
    async with db.transaction():
        session = await get_active_session(
            db, current_user["id"], lock=True, lang=lang
        )
        narrative_fields = (
            ("family_environment", data.family_environment),
            ("social_context", data.social_context),
            ("major_life_events", data.major_life_events),
            ("current_challenges", data.current_challenges),
            ("future_aspirations", data.future_aspirations),
        )
        for field_name, field_text in narrative_fields:
            if not field_text.strip():
                continue
            detection = detect_crisis(field_text, lang)
            if detection["potential_signal"]:
                await log_crisis_incident(
                    db,
                    user_id=current_user["id"],
                    session_id=session["id"],
                    categories=detection["categories"],
                    analyzed_field=field_name,
                )
                await db.execute(
                    "UPDATE assessment_sessions "
                    "SET status = 'flagged_crisis' WHERE id = $1",
                    session["id"],
                )
                return {
                    "status": "potential_crisis_signal",
                    "message": detection["message"],
                    "support": get_helpline_by_country(
                        current_user["country_code"] or "",
                        lang,
                    ),
                    "action_required": True,
                    "clinical_assessment": False,
                }

        values = (
            data.age,
            data.gender,
            data.education_level,
            data.marital_status,
            data.occupation,
            data.family_environment,
            data.social_context,
            data.major_life_events,
            data.current_challenges,
            data.future_aspirations,
        )
        existing_id = await db.fetchval(
            "SELECT id FROM biographical_data WHERE session_id = $1",
            session["id"],
        )
        if existing_id:
            await db.execute(
                """
                UPDATE biographical_data
                SET age=$2, gender=$3, education_level=$4, marital_status=$5,
                    occupation=$6, family_environment=$7, social_context=$8,
                    major_life_events=$9, current_challenges=$10,
                    future_aspirations=$11
                WHERE session_id=$1
                """,
                session["id"],
                *values,
            )
        else:
            await db.execute(
                """
                INSERT INTO biographical_data (
                    session_id, age, gender, education_level, marital_status,
                    occupation, family_environment, social_context,
                    major_life_events, current_challenges, future_aspirations
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                """,
                session["id"],
                *values,
            )
    return {
        "status": "demographics saved",
        "message": get_text("demographics_saved", lang),
    }


def rescale_likert_score(answers: list[int]) -> float:
    # Rescale the response mean from 1–5 to 0–100; this is not a normed score.
    return round((sum(answers) / len(answers) - 1) * 25, 2)


@app.post("/api/assessment/personality")
async def save_personality(
    answers: PersonalityAnswers,
    current_user: Annotated[asyncpg.Record, Depends(get_current_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    lang: Literal["ar", "en"] = Query("ar"),
):
    await require_consent(current_user)
    scores = {
        "openness": rescale_likert_score(answers.openness),
        "conscientiousness": rescale_likert_score(answers.conscientiousness),
        "extraversion": rescale_likert_score(answers.extraversion),
        "agreeableness": rescale_likert_score(answers.agreeableness),
        "neuroticism": rescale_likert_score(answers.neuroticism),
    }

    async with db.transaction():
        session = await get_active_session(
            db, current_user["id"], lock=True, lang=lang
        )
        existing_id = await db.fetchval(
            "SELECT id FROM personality_scores WHERE session_id = $1",
            session["id"],
        )
        values = (
            scores["openness"],
            scores["conscientiousness"],
            scores["extraversion"],
            scores["agreeableness"],
            scores["neuroticism"],
        )
        if existing_id:
            await db.execute(
                """
                UPDATE personality_scores
                SET openness_score=$2, conscientiousness_score=$3,
                    extraversion_score=$4, agreeableness_score=$5,
                    neuroticism_score=$6, generated_at=NOW()
                WHERE session_id=$1
                """,
                session["id"],
                *values,
            )
        else:
            await db.execute(
                """
                INSERT INTO personality_scores (
                    session_id, openness_score, conscientiousness_score,
                    extraversion_score, agreeableness_score, neuroticism_score
                ) VALUES ($1, $2, $3, $4, $5, $6)
                """,
                session["id"],
                *values,
            )

    return {
        "status": "personality saved",
        "message": get_text("personality_saved", lang),
        "scores": scores,
        "scoring_note": (
            "Descriptive rescaling of self-reported responses only; "
            "not a standardized or diagnostic score."
        ),
    }


@app.post("/api/assessment/health-screening")
async def save_health(
    screening: HealthScreening,
    current_user: Annotated[asyncpg.Record, Depends(get_current_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    lang: Literal["ar", "en"] = Query("ar"),
):
    await require_consent(current_user)
    phq9_score = sum(screening.phq9)
    gad7_score = sum(screening.gad7)
    crisis = screening.phq9[8] > 0
    crisis_flags = ["phq9_item_9_positive"] if crisis else []

    async with db.transaction():
        session = await get_active_session(
            db, current_user["id"], lock=True, lang=lang
        )
        existing_id = await db.fetchval(
            "SELECT id FROM health_screening WHERE session_id = $1",
            session["id"],
        )
        if existing_id:
            await db.execute(
                """
                UPDATE health_screening
                SET phq9_score=$2, gad7_score=$3, crisis_flags=$4,
                    crisis_protocol_triggered=$5, screening_date=NOW()
                WHERE session_id=$1
                """,
                session["id"],
                phq9_score,
                gad7_score,
                crisis_flags,
                crisis,
            )
        else:
            await db.execute(
                """
                INSERT INTO health_screening (
                    session_id, phq9_score, gad7_score, crisis_flags,
                    crisis_protocol_triggered
                ) VALUES ($1, $2, $3, $4, $5)
                """,
                session["id"],
                phq9_score,
                gad7_score,
                crisis_flags,
                crisis,
            )

        if crisis:
            await db.execute(
                "UPDATE assessment_sessions SET status = 'flagged_crisis' WHERE id = $1",
                session["id"],
            )
            await log_crisis_incident(
                db,
                user_id=current_user["id"],
                session_id=session["id"],
                categories=["phq9_item_9_positive"],
                analyzed_field="phq9_item_9",
            )

    if crisis:
        return {
            "status": "potential_crisis_signal",
            "message": get_text("crisis_detected", lang),
            "support": get_helpline_by_country(
                current_user["country_code"] or "",
                lang,
            ),
            "action_required": True,
            "clinical_assessment": False,
        }

    return {
        "status": "screening saved",
        "message": get_text("screening_saved", lang),
        "phq9": phq9_score,
        "gad7": gad7_score,
        "note": "Screening totals are not a diagnosis.",
    }


@app.get("/api/crisis/helplines/{country_code}")
async def crisis_helplines(
    country_code: str,
    lang: Literal["ar", "en"] = Query("ar"),
):
    try:
        return get_helpline_by_country(country_code, lang)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error


@app.post("/api/crisis/report")
async def report_crisis(
    current_user: Annotated[asyncpg.Record, Depends(get_current_user)],
    lang: Literal["ar", "en"] = Query("ar"),
):
    support = get_helpline_by_country(current_user["country_code"] or "", lang)
    if lang == "ar":
        message = (
            "نأسف لأنك تمر بوقت صعب. إذا كنت في خطر فوري، اتصل بخدمات "
            "الطوارئ المحلية أو توجّه إلى أقرب قسم طوارئ. يمكنك استخدام دليل "
            "الدعم أدناه أو التواصل الآن مع شخص تثق به."
        )
        resources = [
            "تواصل مع شخص تثق به واطلب منه البقاء معك.",
            "إذا كان هناك خطر فوري، توجّه إلى أقرب قسم طوارئ.",
        ]
    else:
        message = (
            "We are sorry you are going through a difficult time. If you are "
            "in immediate danger, contact local emergency services or go to "
            "the nearest emergency department. You can use the support "
            "directory below or contact someone you trust now."
        )
        resources = [
            "Contact someone you trust and ask them to stay with you.",
            "If there is immediate danger, go to the nearest emergency department.",
        ]

    return {
        "status": "crisis_resources",
        "message": message,
        "support": support,
        "resources": resources,
    }


BOOK_PRICE = Decimal("99.00")
BOOK_CURRENCY = "USD"
GENERATED_BOOKS_DIR = Path(__file__).resolve().parent / "generated_books"


@app.post("/api/payment/create-order")
async def create_order_endpoint(
    current_user: Annotated[asyncpg.Record, Depends(get_current_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    lang: Literal["ar", "en"] = Query("ar"),
):
    await require_consent(current_user)
    session = await get_active_session(db, current_user["id"], lang=lang)
    has_demographics = await db.fetchval(
        "SELECT EXISTS(SELECT 1 FROM biographical_data WHERE session_id = $1)",
        session["id"],
    )
    has_personality = await db.fetchval(
        "SELECT EXISTS(SELECT 1 FROM personality_scores WHERE session_id = $1)",
        session["id"],
    )
    if not has_demographics or not has_personality:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Complete the required assessment steps before checkout",
        )

    try:
        order_data = await create_paypal_order(
            amount=BOOK_PRICE,
            currency=BOOK_CURRENCY,
            custom_id=str(session["id"]),
            request_id=uuid4().hex,
        )
    except PayPalError as error:
        logger.warning("PayPal order creation failed: %s", error)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to create a payment order",
        ) from error

    order_id = order_data["id"]
    try:
        await db.execute(
            """
            INSERT INTO generated_books (
                user_id, session_id, payment_id, payment_status
            ) VALUES ($1, $2, $3, 'created')
            """,
            current_user["id"],
            session["id"],
            order_id,
        )
    except asyncpg.UniqueViolationError as error:
        logger.error("PayPal returned an order ID already in use")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to save the payment order",
        ) from error

    return {"order_id": order_id, "status": order_data.get("status")}


@app.post("/api/payment/capture-order/{order_id}")
async def capture_order_endpoint(
    order_id: str,
    current_user: Annotated[asyncpg.Record, Depends(get_current_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
):
    await require_consent(current_user)

    async with db.transaction():
        book = await db.fetchrow(
            """
            SELECT id, session_id, payment_status
            FROM generated_books
            WHERE payment_id = $1 AND user_id = $2
            FOR UPDATE
            """,
            order_id,
            current_user["id"],
        )
        if book is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment order not found",
            )
        if book["payment_status"] == "completed":
            return {
                "status": "success",
                "book_id": str(book["id"]),
                "download_url": f"/api/books/{book['id']}/download",
            }
        if book["payment_status"] not in {"created", "paid"}:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Payment order cannot be captured in its current state",
            )

        if book["payment_status"] == "created":
            try:
                await capture_paypal_order(
                    order_id,
                    expected_amount=BOOK_PRICE,
                    expected_currency=BOOK_CURRENCY,
                    expected_custom_id=str(book["session_id"]),
                )
            except PayPalError as error:
                logger.warning("PayPal capture verification failed: %s", error)
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Unable to verify the payment with PayPal",
                ) from error
            await db.execute(
                "UPDATE generated_books SET payment_status = 'paid' WHERE id = $1",
                book["id"],
            )

    demographic_row = await db.fetchrow(
        "SELECT age FROM biographical_data WHERE session_id = $1",
        book["session_id"],
    )
    personality_row = await db.fetchrow(
        """
        SELECT openness_score, conscientiousness_score, extraversion_score,
               agreeableness_score, neuroticism_score
        FROM personality_scores WHERE session_id = $1
        """,
        book["session_id"],
    )
    strengths_row = await db.fetchrow(
        "SELECT top_5_strengths FROM intelligences_and_strengths "
        "WHERE session_id = $1",
        book["session_id"],
    )

    user_data = {
        "full_name": current_user["full_name"],
        "language": current_user["language"] or "ar",
        "demographics": dict(demographic_row) if demographic_row else {},
        "personality": dict(personality_row) if personality_row else {},
        "strengths": dict(strengths_row) if strengths_row else {},
    }
    file_name = f"book_{book['id']}.pdf"
    output_path = str(GENERATED_BOOKS_DIR / file_name)
    try:
        await run_in_threadpool(
            generate_book_pdf,
            user_data,
            output_path,
            user_data["language"],
        )
    except (OSError, RuntimeError, ValueError) as error:
        logger.exception("PDF generation failed for paid book %s", book["id"])
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment succeeded, but the book could not be generated yet. Retry to resume generation.",
        ) from error

    download_url = f"/api/books/{book['id']}/download"
    async with db.transaction():
        await db.execute(
            """
            UPDATE generated_books
            SET payment_status = 'completed', pdf_url = $2
            WHERE id = $1 AND user_id = $3 AND payment_status = 'paid'
            """,
            book["id"],
            download_url,
            current_user["id"],
        )
        await db.execute(
            "UPDATE assessment_sessions SET status = 'completed' WHERE id = $1",
            book["session_id"],
        )

    return {
        "status": "success",
        "book_id": str(book["id"]),
        "download_url": download_url,
    }


@app.get("/api/books/{book_id}/download")
async def download_book(
    book_id: UUID,
    current_user: Annotated[asyncpg.Record, Depends(get_current_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
):
    book = await db.fetchrow(
        """
        SELECT payment_status, pdf_url
        FROM generated_books
        WHERE id = $1 AND user_id = $2
        """,
        book_id,
        current_user["id"],
    )
    if book is None or book["payment_status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    expected_url = f"/api/books/{book_id}/download"
    if book["pdf_url"] != expected_url:
        logger.error("Unexpected stored PDF URL for book %s", book_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Book download is unavailable",
        )

    file_path = GENERATED_BOOKS_DIR / f"book_{book_id}.pdf"
    if not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book file not found",
        )

    await db.execute(
        "UPDATE generated_books SET download_count = download_count + 1 WHERE id = $1",
        book_id,
    )
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=f"personal-book-{book_id}.pdf",
    )
