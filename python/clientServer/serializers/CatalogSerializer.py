def serialize_catalog(catalog):
    return {
        "id": catalog.id,
        "description": catalog.description,
        "name": catalog.name,
        "date_created": catalog.date_created,
    }


def serialize_catalogs(catalogs):
    return [serialize_catalog(catalog) for catalog in catalogs]
