from clientServer.services import CatalogServices as CatalogServices

import re
import html


def validate_catalog_params(json):
    validated_json = {}
    if "name" not in json:
        raise ValueError("Name is required")
    if "description" not in json:
        raise ValueError("Description is required")
    if "public" not in json:
        raise ValueError("Public is required")
    if "permissions" not in json:
        raise ValueError("Permissions is required")
    validated_json["name"] = validate_text(json["name"])
    validated_json["description"] = validate_text(json["description"])
    is_public = validate_boolean(json["public"])
    validated_json["public"] = is_public
    if is_public:
        validated_json["permissions"] = []
    else:
        validated_json["permissions"] = validate_permissions(json["permissions"])

    return validated_json


def validate_catalog_id(catalog_id):
    catalog_id = int(catalog_id)
    catalog = CatalogServices.find_by_id(catalog_id)
    if catalog is None:
        raise ValueError("catalog_id must be a valid catalog")

    if type(catalog_id) is not int:
        raise ValueError("Catalog ID must be an integer")
    return catalog_id


def sanitize_text(text_input):
    return html.escape(text_input)


def is_valid_email(email):
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    domain_pattern = r"^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

    return bool(re.match(email_pattern, email)) or bool(re.match(domain_pattern, email))


def validate_permissions(permissions):
    sanitized_permissions = []
    for permission in permissions:
        if type(permission) is not str:
            raise ValueError("Permission must be a string")
        sanitized_permission = sanitize_text(permission)
        if not is_valid_email(sanitized_permission):
            raise ValueError("Permission must be a valid email or domain")
        sanitized_permissions.append(sanitized_permission)

    return sanitized_permissions


def validate_text(text_input):
    if type(text_input) is not str:
        raise ValueError("Text input must be a string")
    sanitized_text = sanitize_text(text_input)
    return sanitized_text


def validate_boolean(boolean_input):
    if type(boolean_input) is not bool:
        raise ValueError("Boolean input must be true or false")
    return boolean_input


def validate_catalog_entry(catalog_entry):
    if "name" not in catalog_entry:
        raise ValueError("Name is required")
    if "description" not in catalog_entry:
        raise ValueError("Description is required")
    if "column" not in catalog_entry:
        raise ValueError("Public is required")
    if "populateMetadataFromZip" not in catalog_entry:
        raise ValueError("Permissions is required")
    if "zipFile" not in catalog_entry:
        raise ValueError("Permissions is required")

    populateMetadataFromZip = validate_boolean(catalog_entry["populateMetadataFromZip"])
    name = ""
    description = ""

    if not populateMetadataFromZip:
        name = validate_text(catalog_entry["name"])
        description = validate_text(catalog_entry["description"])

    sanitized_catalog_entry = {
        "name": name,
        "description": description,
        "column": validate_text(catalog_entry["column"]),
        "populateMetadataFromZip": populateMetadataFromZip,
        "zipFile": validate_zip_file(catalog_entry["zipFile"]),
    }

    return sanitized_catalog_entry


def validate_zip_file(zip_file):
    return {}
