from api.db import db
import api.encryption as encryption
from api.apiKeys import CLIENT_SERVER_API_KEYS, ADMIN_SERVICES_API_KEY
from api.models.Catalog import Catalog
from api.models.CatalogAccess import CatalogAccess
from api.validators import CatalogValidators as CatalogValidators
from api.services import AdminServices as AdminServices
from api.services import CatalogAccessServices as CatalogAccessServices
from api.services import (
    CatalogEntryUploadServices as CatalogEntryUploadServices,
)

from sqlalchemy import select, outerjoin, or_
import datetime


# make private
def find_by_id(catalog_id):
    try:
        validated_catalog_id = CatalogValidators.validate_catalog_id(catalog_id)
        return Catalog.query.get(validated_catalog_id)
    except:
        return None


def create(json, user, admin_services_api_key):
    try:
        if not AdminServices.isAdmin(user, admin_services_api_key):
            return None
        catalog_params = CatalogValidators.validate_catalog_params(json)

        name = catalog_params["name"]
        description = catalog_params["description"]
        public = catalog_params["public"]
        permissions = catalog_params["permissions"]
        new_catalog = Catalog(
            name=name,
            description=description,
            date_created=datetime.datetime.now().strftime("%Y-%m-%d"),
            public=public,
        )
        db.session.add(new_catalog)
        db.session.commit()

        if not public:
            for permission in permissions:
                CatalogAccessServices.create(
                    new_catalog.id, permission, user, admin_services_api_key
                )

        return new_catalog
    except:
        return None


# make private
def destroy(catalog_id, user, admin_services_api_key):
    try:
        if not AdminServices.isAdmin(user, admin_services_api_key):
            return None
        validated_catalog_id = CatalogValidators.validate_catalog_id(catalog_id)
        CatalogAccessServices.destroy_all(validated_catalog_id)
        CatalogEntryUploadServices.destroy_all(validated_catalog_id)

        catalog = Catalog.query.get(validated_catalog_id)
        db.session.delete(catalog)
        db.session.commit()
    except:
        return None


# make private
def update(catalog_id, json, user, admin_services_api_key):
    try:
        if not AdminServices.isAdmin(user, admin_services_api_key):
            return None
        catalog_id = CatalogValidators.validate_catalog_id(catalog_id)
        catalog_params = CatalogValidators.validate_catalog_params(json)

        name = catalog_params["name"]
        description = catalog_params["description"]
        public = catalog_params["public"]
        permissions = catalog_params["permissions"]

        catalog = find_by_id(catalog_id)
        if catalog == None:
            return None
        catalog.name = name
        catalog.description = description
        catalog.public = public
        db.session.commit()

        if not public:
            CatalogAccessServices.destroy_all(catalog_id)
            for permission in permissions:
                CatalogAccessServices.create(
                    catalog_id, permission, user, admin_services_api_key
                )
        return catalog
    except:
        return None


# make private
def find_all():
    return Catalog.query.all()


def admin_catalog(user, catalog_id, admin_services_api_key):
    try:
        if AdminServices.isAdmin(user, admin_services_api_key):
            catalog = find_by_id(catalog_id)
            return catalog
    except:
        return None


def admin_catalogs(user, admin_services_api_key):
    try:
        if AdminServices.isAdmin(user, admin_services_api_key):
            catalogs = find_all()
            return catalogs
    except:
        return []


def user_catalog(user, catalog_id, client_server_api_key):
    try:
        if client_server_api_key not in CLIENT_SERVER_API_KEYS:
            raise PermissionError("Invalid UserServicesAPIKey")

        catalog = find_by_id(catalog_id)
        if catalog == None or not catalog.user_has_access(user):
            return None
        return catalog

    except Exception:
        return None


def user_catalogs(user, client_server_api_key):
    try:
        if client_server_api_key not in CLIENT_SERVER_API_KEYS:
            raise PermissionError("Invalid UserServicesAPIKey")
        user_id = user.id
        user_domain = user.domain()
        encrypted_domain = encryption.encrypt_user_data(user_domain)

        catalog_join_query = outerjoin(
            Catalog, CatalogAccess, Catalog.id == CatalogAccess.catalog_id
        )
        user_catalogs_query = (
            select(Catalog)
            .select_from(catalog_join_query)
            .where(
                or_(
                    catalog_join_query.c.catalog_access_user_id == user_id,
                    catalog_join_query.c.catalog_public == True,
                    catalog_join_query.c.catalog_access_encrypted_domain
                    == encrypted_domain,
                )
            )
            .distinct()
        )

        user_catalogs = [row[0] for row in db.session.execute(user_catalogs_query)]

        return user_catalogs
    except Exception:
        return []
