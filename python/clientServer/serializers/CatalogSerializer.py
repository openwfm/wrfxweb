from . import CatalogAccessSerializer as CatalogAccessSerializer
from . import CatalogEntrySerializer as CatalogEntrySerializer


def serialize_catalog(catalog):
    return {
        "id": catalog.id,
        "description": catalog.description,
        "name": catalog.name,
        "date_created": catalog.date_created,
        "entries": CatalogEntrySerializer.serialize_entries(catalog.entries()),
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
        "entries": CatalogEntrySerializer.serialize_entries(catalog.entries()),
        "permissions": CatalogAccessSerializer.serialize_accesses(
            catalog.permissions()
        ),
    }
