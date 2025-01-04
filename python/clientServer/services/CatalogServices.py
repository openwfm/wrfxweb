from ..app import db
from ..models.Catalog import Catalog
from . import CatalogAccessServices as CatalogAccessServices
import datetime


def create(name, description, public=False):
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


def find_all():
    return Catalog.query.all()
