def serialize_access(access):
    return {
        "id": access.id,
        "catalog_id": access.catalog_id,
        "type": access.permission_type(),
        "text": access.permission_text(),
    }


def serialize_accesses(accesses):
    return [serialize_access(access) for access in accesses]
