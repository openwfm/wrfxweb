import re
import pathvalidate
import html
from werkzeug.utils import secure_filename
import os


def validate_text(text_input):
    if text_input == None:
        return ""
    if type(text_input) is not str:
        raise ValueError("Text input must be a string")
    sanitized_text = sanitize_text(text_input)
    return sanitized_text


def validate_boolean(boolean_input):
    if type(boolean_input) is not bool:
        raise ValueError("Boolean input must be true or false")
    return boolean_input


def validate_zip(zip_file):
    file_name = secure_filename(zip_file.filename)
    if file_name == "":
        raise ValueError("No file present")
    file_ext = os.path.splitext(file_name)[1]
    if file_ext != ".zip" or zip_file.mimetype != "application/zip":
        raise ValueError("Uploaded File must be a zip file")

    return zip_file


def validate_int_id(int_id):
    if type(int_id) is str:
        if not int_id.isdigit():
            raise ValueError("id must be an integer")
        return int(int_id)
    if type(int_id) is not int:
        raise ValueError("id must be an integer")
    return int_id


def sanitize_text(text_input):
    return html.escape(text_input)


def sanitize_path(path):
    return pathvalidate.sanitize_filename(path, platform="auto")


def is_valid_email(email):
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    domain_pattern = r"^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

    return bool(re.match(email_pattern, email)) or bool(re.match(domain_pattern, email))
