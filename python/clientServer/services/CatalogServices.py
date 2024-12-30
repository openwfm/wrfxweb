from ..app import db
from ..models.Catalog import Catalog
import datetime


def create(name, description):
    new_catalog = Catalog(
        name=name,
        description=description,
        date_created=datetime.datetime.now().strftime("%Y-%m-%d"),
    )
    db.session.add(new_catalog)
    db.session.commit()
    return new_catalog


def destroy(catalog_id):
    catalog = Catalog.query.get(catalog_id)
    db.session.delete(catalog)
    db.session.commit()


def find_all():
    return Catalog.query.all()
