def serialize_access(access):
    return {
        "id": access.id,
        "catalog_id": access.catalog_id,
        "user_id": access.user_id,
        "domain": access.domain,
    }


def serialize_accesses(accesses):
    return [serialize_access(access) for access in accesses]
