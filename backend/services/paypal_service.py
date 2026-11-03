import hashlib
import os
import re
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
load_dotenv()

PAYPAL_ENVIRONMENTS = {
    "sandbox": "https://api-m.sandbox.paypal.com",
    "live": "https://api-m.paypal.com",
}
ORDER_ID_PATTERN = re.compile(r"^[A-Za-z0-9-]{1,64}$")
REQUEST_TIMEOUT = httpx.Timeout(20.0, connect=5.0)


class PayPalError(RuntimeError):
    """Raised when PayPal is unavailable or returns an invalid response."""


def _configuration() -> tuple[str, str, str]:
    client_id = os.getenv("PAYPAL_CLIENT_ID")
    client_secret = os.getenv("PAYPAL_CLIENT_SECRET")
    environment = os.getenv("PAYPAL_ENV", "sandbox").strip().lower()
    api_base = PAYPAL_ENVIRONMENTS.get(environment)
    if not client_id or not client_secret or not api_base:
        raise PayPalError("PayPal credentials or environment are not configured")
    return client_id, client_secret, api_base


def _validate_amount(amount: Decimal, currency: str) -> str:
    if currency != "USD":
        raise ValueError("Only USD payments are currently supported")
    try:
        value = Decimal(str(amount))
    except (InvalidOperation, ValueError):
        raise ValueError("Payment amount must be a valid decimal") from None
    if not value.is_finite() or value <= 0 or value.quantize(Decimal("0.01")) != value:
        raise ValueError("Payment amount must be positive and have at most 2 decimals")
    return format(value, ".2f")


async def _get_access_token(
    client: httpx.AsyncClient, client_id: str, client_secret: str, api_base: str
) -> str:
    try:
        response = await client.post(
            f"{api_base}/v1/oauth2/token",
            data={"grant_type": "client_credentials"},
            auth=httpx.BasicAuth(client_id, client_secret),
        )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError) as error:
        raise PayPalError("Unable to authenticate with PayPal") from error
    token = payload.get("access_token") if isinstance(payload, dict) else None
    if not isinstance(token, str) or not token:
        raise PayPalError("PayPal returned an invalid access token")
    return token


def _validate_capture(
    result: dict[str, Any],
    *,
    expected_amount: str,
    expected_currency: str,
    expected_custom_id: str,
) -> None:
    if result.get("status") != "COMPLETED":
        raise PayPalError("PayPal payment has not completed")

    purchase_units = result.get("purchase_units")
    if not isinstance(purchase_units, list):
        raise PayPalError("PayPal returned invalid payment details")

    for unit in purchase_units:
        if not isinstance(unit, dict) or unit.get("custom_id") != expected_custom_id:
            continue
        payments = unit.get("payments")
        captures = payments.get("captures") if isinstance(payments, dict) else None
        if not isinstance(captures, list):
            continue
        for capture in captures:
            if not isinstance(capture, dict) or capture.get("status") != "COMPLETED":
                continue
            amount = capture.get("amount")
            if (
                isinstance(amount, dict)
                and amount.get("currency_code") == expected_currency
                and amount.get("value") == expected_amount
            ):
                return

    raise PayPalError("Captured payment does not match the expected order")


async def create_paypal_order(
    amount: Decimal,
    currency: str = "USD",
    *,
    custom_id: str,
    request_id: str,
) -> dict[str, Any]:
    """Create a server-priced PayPal order associated with one assessment session."""
    client_id, client_secret, api_base = _configuration()
    value = _validate_amount(amount, currency)
    if not custom_id or len(custom_id) > 127:
        raise ValueError("custom_id is invalid")
    if not request_id or len(request_id) > 38:
        raise ValueError("request_id is invalid")

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        token = await _get_access_token(client, client_id, client_secret, api_base)
        try:
            response = await client.post(
                f"{api_base}/v2/checkout/orders",
                json={
                    "intent": "CAPTURE",
                    "purchase_units": [
                        {
                            "custom_id": custom_id,
                            "amount": {"currency_code": currency, "value": value},
                            "description": "Personal self-reflection book",
                        }
                    ],
                },
                headers={
                    "Authorization": f"Bearer {token}",
                    "PayPal-Request-Id": request_id,
                },
            )
            response.raise_for_status()
            result = response.json()
        except (httpx.HTTPError, ValueError) as error:
            raise PayPalError("Unable to create PayPal order") from error

    if not isinstance(result, dict) or not isinstance(result.get("id"), str):
        raise PayPalError("PayPal returned an invalid order")
    return result


async def capture_paypal_order(
    order_id: str,
    *,
    expected_amount: Decimal,
    expected_currency: str,
    expected_custom_id: str,
) -> dict[str, Any]:
    """Capture and verify the amount, currency, and assessment session."""
    if not ORDER_ID_PATTERN.fullmatch(order_id):
        raise ValueError("PayPal order ID is invalid")
    client_id, client_secret, api_base = _configuration()
    value = _validate_amount(expected_amount, expected_currency)
    request_id = f"cap-{hashlib.sha256(order_id.encode('utf-8')).hexdigest()[:32]}"

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        token = await _get_access_token(client, client_id, client_secret, api_base)
        try:
            response = await client.post(
                f"{api_base}/v2/checkout/orders/{order_id}/capture",
                headers={
                    "Authorization": f"Bearer {token}",
                    "PayPal-Request-Id": request_id,
                },
            )
            response.raise_for_status()
            result = response.json()
        except (httpx.HTTPError, ValueError) as error:
            raise PayPalError("Unable to capture PayPal order") from error

    if not isinstance(result, dict):
        raise PayPalError("PayPal returned invalid capture details")
    _validate_capture(
        result,
        expected_amount=value,
        expected_currency=expected_currency,
        expected_custom_id=expected_custom_id,
    )
    return result
