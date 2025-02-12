import re
import pathvalidate
import html


def validate_text(text_input):
    if type(text_input) is not str:
        raise ValueError("Text input must be a string")
    sanitized_text = sanitize_text(text_input)
    return sanitized_text


def validate_boolean(boolean_input):
    if type(boolean_input) is not bool:
        raise ValueError("Boolean input must be true or false")
    return boolean_input


def validate_zip(zip_file):
    return zip_file


def sanitize_text(text_input):
    return html.escape(text_input)


def sanitize_path(path):
    return pathvalidate.sanitize_filename(path, platform="auto")


def is_valid_email(email):
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    domain_pattern = r"^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

    return bool(re.match(email_pattern, email)) or bool(re.match(domain_pattern, email))
