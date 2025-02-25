from api.serializers import CatalogAccessSerializer as CatalogAccessSerializer
from api.serializers import CatalogEntrySerializer as CatalogEntrySerializer
from api.services import AdminServices as AdminServices


def serialize_catalog(catalog):
    if catalog == None:
        return {}
    return {
        "id": catalog.id,
        "description": catalog.description,
        "name": catalog.name,
        "date_created": catalog.date_created,
        "entries": CatalogEntrySerializer.serialize_catalog_entries(catalog.entries()),
    }


def serialize_catalogs(catalogs):
    return [serialize_catalog(catalog) for catalog in catalogs]


def serialize_catalogs_with_permissions(catalogs, user, admin_services_api_key):
    return [
        serialize_catalog_with_permissions(catalog, user, admin_services_api_key)
        for catalog in catalogs
    ]


def serialize_catalog_with_permissions(catalog, user, admin_services_api_key):
    if catalog == None:
        return {}
    if not AdminServices.isAdmin(user, admin_services_api_key):
        return serialize_catalog(catalog)
    return {
        "id": catalog.id,
        "description": catalog.description,
        "name": catalog.name,
        "public": catalog.public,
        "date_created": catalog.date_created,
        "entries": CatalogEntrySerializer.serialize_catalog_entries(catalog.entries()),
        "permissions": CatalogAccessSerializer.serialize_accesses(
            catalog.permissions(), user, admin_services_api_key
        ),
    }
