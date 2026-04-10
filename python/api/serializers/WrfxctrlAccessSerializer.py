from api.services import AdminServices as AdminServices
from api.validators.utils import sanitize_text


def serialize_access(access):
    if access == None:
        return {}
    return {
        "id": sanitize_text(f"{access.id}"),
        "type": sanitize_text(f"{access.permission_type()}"),
        "text": sanitize_text(f"{access.permission_text()}"),
    }


def serialize_accesses(accesses):
    return [serialize_access(access) for access in accesses]
