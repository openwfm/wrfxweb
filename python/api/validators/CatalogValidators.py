# from api.services import CatalogServices as CatalogServices
from api.validators import utils as utils


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
    if type(catalog_id) is str:
        if not catalog_id.isdigit():
            raise ValueError("catalog_id must be an integer")
        return int(catalog_id)
    if type(catalog_id) is not int:
        raise ValueError("catalog_id must be an integer")
    return catalog_id


def validate_catalog_ids(catalog_ids):
    if type(catalog_ids) != list:
        raise ValueError("catalog_ids must be a list")
    return [validate_catalog_id(catalog_id) for catalog_id in catalog_ids]


# def validate_user_catalog_id(catalog_id, current_user):
#     catalog_id = int(catalog_id)
#     catalog = CatalogServices.find_by_id(catalog_id)
#     if catalog is None:
#         raise ValueError("catalog_id must be a valid catalog")
#     if not catalog.user_has_access(current_user):
#         raise ValueError("user does not have access to catalog")
#
#     if type(catalog_id) is not int:
#         raise ValueError("Catalog ID must be an integer")
#     return catalog


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
