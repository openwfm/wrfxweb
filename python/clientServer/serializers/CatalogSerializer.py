from . import CatalogAccessSerializer as CatalogAccessSerializer


def serialize_catalog(catalog):
    return {
        "id": catalog.id,
        "description": catalog.description,
        "name": catalog.name,
        "date_created": catalog.date_created,
    }


def serialize_catalogs(catalogs):
    return [serialize_catalog(catalog) for catalog in catalogs]


def serialize_catalogs_with_permissions(catalogs):
    return [serialize_catalog_with_permissions(catalog) for catalog in catalogs]


def serialize_catalog_with_permissions(catalog):
    return {
        "id": catalog.id,
        "description": catalog.description,
        "name": catalog.name,
        "public": catalog.public,
        "date_created": catalog.date_created,
        "permissions": CatalogAccessSerializer.serialize_accesses(
            catalog.permissions()
        ),
    }
