from ..app import db
from ..models.Catalog import Catalog
from . import CatalogAccessServices as CatalogAccessServices
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
    return new_catalog


def destroy(catalog_id):
    CatalogAccessServices.destroy_all(catalog_id)

    catalog = Catalog.query.get(catalog_id)
    db.session.delete(catalog)
    db.session.commit()


def update(catalog_id, catalog_params):
    name = catalog_params["name"]
    description = catalog_params["description"]
    public = catalog_params["public"]
    permissions = catalog_params["permissions"]

    catalog = Catalog.query.get(catalog_id)
    catalog.name = name
    catalog.description = description
    catalog.public = public
    db.session.commit()
    return catalog


def find_all():
    return Catalog.query.all()
