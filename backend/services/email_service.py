import asyncio
import html
import os
import re
import smtplib
import ssl
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, parseaddr
from pathlib import Path
from typing import Mapping, Protocol


class EmailDatabase(Protocol):
    async def execute(self, query: str, *args: object) -> str: ...


EMAIL_TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates" / "emails"
PLACEHOLDER_PATTERN = re.compile(r"{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}")


class EmailConfigurationError(RuntimeError):
    """Raised when required SMTP settings are missing or invalid."""


class EmailDeliveryError(RuntimeError):
    """Raised when the SMTP server rejects or cannot deliver the email."""


class EmailService:
    @staticmethod
    def _smtp_settings() -> tuple[str, int, str, str, str, str]:
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
        try:
            smtp_port = int(os.getenv("SMTP_PORT", "587"))
        except ValueError as error:
            raise EmailConfigurationError("SMTP_PORT must be an integer") from error
        smtp_user = os.getenv("SMTP_USER", "").strip()
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        from_email = os.getenv("FROM_EMAIL", "").strip() or smtp_user
        from_name = os.getenv("FROM_NAME", "بوصلة النفس").strip()

        if not smtp_host:
            raise EmailConfigurationError("SMTP_HOST must not be empty")
        if not 1 <= smtp_port <= 65535:
            raise EmailConfigurationError("SMTP_PORT is outside the valid range")
        if not smtp_user or not smtp_password:
            raise EmailConfigurationError(
                "SMTP_USER and SMTP_PASSWORD must be configured"
            )
        if not EmailService._is_valid_address(from_email):
            raise EmailConfigurationError("FROM_EMAIL must be a valid email address")
        if not from_name or any(char in from_name for char in "\r\n"):
            raise EmailConfigurationError("FROM_NAME must be a valid display name")

        return smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name

    @staticmethod
    def _is_valid_address(value: str) -> bool:
        if not value or any(char in value for char in "\r\n"):
            return False
        display_name, address = parseaddr(value)
        return not display_name and address == value and "@" in address

    def _create_message(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        attachments: list[str] | None,
        from_email: str,
        from_name: str,
    ) -> MIMEMultipart:
        if not self._is_valid_address(to_email):
            raise ValueError("to_email must be a valid email address")
        if not subject.strip() or any(char in subject for char in "\r\n"):
            raise ValueError("subject must be a non-empty single-line string")
        if not html_content:
            raise ValueError("html_content must not be empty")

        message = MIMEMultipart()
        message["From"] = formataddr((from_name, from_email))
        message["To"] = to_email
        message["Subject"] = subject
        message.attach(MIMEText(html_content, "html", "utf-8"))

        for file_path in attachments or []:
            path = Path(file_path)
            if not path.is_file():
                raise FileNotFoundError(f"Email attachment not found: {path.name}")
            part = MIMEBase("application", "octet-stream")
            with path.open("rb") as attachment:
                part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                "attachment",
                filename=path.name,
            )
            message.attach(part)

        return message

    def _send_sync(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        attachments: list[str] | None,
    ) -> None:
        (
            smtp_host,
            smtp_port,
            smtp_user,
            smtp_password,
            from_email,
            from_name,
        ) = self._smtp_settings()
        message = self._create_message(
            to_email,
            subject,
            html_content,
            attachments,
            from_email,
            from_name,
        )
        context = ssl.create_default_context()

        if smtp_port == 465:
            with smtplib.SMTP_SSL(
                smtp_host,
                smtp_port,
                timeout=20,
                context=context,
            ) as server:
                server.login(smtp_user, smtp_password)
                server.send_message(message)
            return

        with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.send_message(message)

    @staticmethod
    async def log_email(
        db: EmailDatabase,
        to_email: str,
        subject: str,
        status: str,
        error_code: str | None = None,
    ) -> None:
        await db.execute(
            """
            INSERT INTO email_logs (to_email, subject, status, error_code)
            VALUES ($1, $2, $3, $4)
            """,
            to_email,
            subject,
            status,
            error_code,
        )

    async def send_email(
        self,
        db: EmailDatabase,
        to_email: str,
        subject: str,
        html_content: str,
        attachments: list[str] | None = None,
    ) -> None:
        try:
            await asyncio.to_thread(
                self._send_sync,
                to_email,
                subject,
                html_content,
                attachments,
            )
        except EmailConfigurationError as error:
            await self.log_email(
                db,
                to_email,
                subject,
                "failed",
                type(error).__name__,
            )
            raise
        except (smtplib.SMTPException, OSError) as error:
            await self.log_email(
                db,
                to_email,
                subject,
                "failed",
                type(error).__name__,
            )
            raise EmailDeliveryError("SMTP email delivery failed") from error

        await self.log_email(db, to_email, subject, "sent")


def render_email_template(
    template_name: str,
    values: Mapping[str, str],
) -> str:
    if Path(template_name).name != template_name or not template_name.endswith(".html"):
        raise ValueError("template_name must be an HTML filename")

    template_path = EMAIL_TEMPLATE_DIR / template_name
    if not template_path.is_file():
        raise FileNotFoundError(f"Email template not found: {template_name}")

    template = template_path.read_text(encoding="utf-8")
    placeholders = set(PLACEHOLDER_PATTERN.findall(template))
    missing_values = placeholders.difference(values)
    if missing_values:
        raise ValueError(
            "Missing email template values: " + ", ".join(sorted(missing_values))
        )

    return PLACEHOLDER_PATTERN.sub(
        lambda match: html.escape(str(values[match.group(1)]), quote=True),
        template,
    )


email_service = EmailService()


async def send_welcome_email(
    db: EmailDatabase,
    to_email: str,
    full_name: str,
) -> None:
    html_content = render_email_template(
        "welcome_ar.html",
        {"full_name": full_name},
    )
    await email_service.send_email(
        db,
        to_email=to_email,
        subject="مرحباً بك في بوصلة النفس",
        html_content=html_content,
    )
