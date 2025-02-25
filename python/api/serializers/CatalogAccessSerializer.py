from api.services import AdminServices as AdminServices


def serialize_access(access, user, admin_services_api_key):
    if access == None or not AdminServices.isAdmin(user, admin_services_api_key):
        return {}
    return {
        "id": access.id,
        "catalog_id": access.catalog_id,
        "type": access.permission_type(),
        "text": access.permission_text(),
    }


def serialize_accesses(accesses, user, admin_services_api_key):
    if not AdminServices.isAdmin(user, admin_services_api_key):
        return []
    return [
        serialize_access(access, user, admin_services_api_key) for access in accesses
    ]
