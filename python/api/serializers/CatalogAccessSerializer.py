from api.services import AdminServices as AdminServices
from api.validators.utils import sanitize_text


def serialize_access(access, user, admin_services_api_key):
    if access == None or not AdminServices.isAdmin(user, admin_services_api_key):
        return {}
    return {
        "id": sanitize_text(f"{access.id}"),
        "catalog_id": sanitize_text(f"{access.catalog_id}"),
        "type": sanitize_text(f"{access.permission_type()}"),
        "text": sanitize_text(f"{access.permission_text()}"),
    }


def serialize_accesses(accesses, user, admin_services_api_key):
    if not AdminServices.isAdmin(user, admin_services_api_key):
        return []
    return [
        serialize_access(access, user, admin_services_api_key) for access in accesses
    ]
