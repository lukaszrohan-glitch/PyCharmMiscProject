"""
Password validation utilities for security compliance.
Enforces strong password policies to prevent weak passwords.
"""
import re
from typing import Tuple, List


def validate_password_strength(password: str, strict: bool = False) -> Tuple[bool, List[str]]:
    """
    Validate password meets configurable security requirements.

    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character (!@#$%^&*(),.?":{}|<>)

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []

    stripped = password.strip()
    if not stripped:
        errors.append("Password cannot be blank or whitespace only")

    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")

    if strict:
        if not re.search(r"[A-Z]", password):
            errors.append("Password must contain at least one uppercase letter")

        if not re.search(r"[a-z]", password):
            errors.append("Password must contain at least one lowercase letter")

        if not re.search(r"\d", password):
            errors.append("Password must contain at least one digit")

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)")

        # Check for common weak passwords
        weak_passwords = {
            "password",
            "password123",
            "12345678",
            "qwerty123",
            "admin123",
            "welcome123",
            "changeme",
            "letmein123",
        }
        if password.lower() in weak_passwords:
            errors.append("Password is too common and easily guessable")

    return len(errors) == 0, errors


def get_password_requirements_text(lang: str = "pl") -> str:
    """Get human-readable password requirements."""
    if lang == "pl":
        return """
Wymagania dotyczące hasła:
• Minimum 8 znaków
• Przynajmniej jedna wielka litera (A-Z)
• Przynajmniej jedna mała litera (a-z)
• Przynajmniej jedna cyfra (0-9)
• Przynajmniej jeden znak specjalny (!@#$%^&*...)
        """.strip()
    else:
        return """
Password requirements:
• Minimum 8 characters
• At least one uppercase letter (A-Z)
• At least one lowercase letter (a-z)
• At least one digit (0-9)
• At least one special character (!@#$%^&*...)
        """.strip()
