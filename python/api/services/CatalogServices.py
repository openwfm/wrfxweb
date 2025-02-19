from api.db import db
import api.encryption as encryption
from api.models.Catalog import Catalog
from api.models.CatalogAccess import CatalogAccess
from api.services import CatalogAccessServices as CatalogAccessServices
from api.services import (
    CatalogEntryUploadServices as CatalogEntryUploadServices,
)

from sqlalchemy import select, outerjoin, or_
import datetime


def find_by_id(catalog_id):
    return Catalog.query.get(catalog_id)


def create(catalog_params):
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
            CatalogAccessServices.create(new_catalog.id, permission)

    return new_catalog


def destroy(catalog_id):
    CatalogAccessServices.destroy_all(catalog_id)
    CatalogEntryUploadServices.destroy_all(catalog_id)

    catalog = Catalog.query.get(catalog_id)
    db.session.delete(catalog)
    db.session.commit()


def update(catalog_id, catalog_params):
    name = catalog_params["name"]
    description = catalog_params["description"]
    public = catalog_params["public"]
    permissions = catalog_params["permissions"]

    catalog = find_by_id(catalog_id)
    catalog.name = name
    catalog.description = description
    catalog.public = public
    db.session.commit()

    if not public:
        CatalogAccessServices.destroy_all(catalog_id)
        for permission in permissions:
            CatalogAccessServices.create(catalog_id, permission)
    return catalog


def find_all():
    return Catalog.query.all()


def find_by_user(user):
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
    )

    user_catalogs = [row[0] for row in db.session.execute(user_catalogs_query)]

    return user_catalogs
