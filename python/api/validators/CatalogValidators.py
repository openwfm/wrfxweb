from clientServer.services import CatalogServices as CatalogServices
from clientServer.validators import utils as utils

from flask_login import current_user


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
    validated_json["name"] = utils.validate_text(json["name"])
    validated_json["description"] = utils.validate_text(json["description"])
    is_public = utils.validate_boolean(json["public"])
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


def validate_catalog(catalog_id):
    catalog_id = int(catalog_id)
    catalog = CatalogServices.find_by_id(catalog_id)
    if catalog is None:
        raise ValueError("catalog_id must be a valid catalog")

    return catalog


def validate_user_catalog_id(catalog_id):
    catalog_id = int(catalog_id)
    catalog = CatalogServices.find_by_id(catalog_id)
    if catalog is None:
        raise ValueError("catalog_id must be a valid catalog")
    if not catalog.user_has_access(current_user):
        raise ValueError("user does not have access to catalog")

    if type(catalog_id) is not int:
        raise ValueError("Catalog ID must be an integer")
    return catalog


def validate_permissions(permissions):
    sanitized_permissions = []
    for permission in permissions:
        if type(permission) is not str:
            raise ValueError("Permission must be a string")
        sanitized_permission = utils.sanitize_text(permission)
        if not utils.is_valid_email(sanitized_permission):
            raise ValueError("Permission must be a valid email or domain")
        sanitized_permissions.append(sanitized_permission)

    return sanitized_permissions


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

    populateMetadataFromZip = utils.validate_boolean(
        catalog_entry["populateMetadataFromZip"]
    )
    name = ""
    description = ""

    if not populateMetadataFromZip:
        name = utils.validate_text(catalog_entry["name"])
        description = utils.validate_text(catalog_entry["description"])

    sanitized_catalog_entry = {
        "name": name,
        "description": description,
        "column": utils.validate_text(catalog_entry["column"]),
        "populateMetadataFromZip": populateMetadataFromZip,
        "zipFile": validate_zip_file(catalog_entry["zipFile"]),
    }

    return sanitized_catalog_entry


def validate_zip_file(zip_file):
    return {}
