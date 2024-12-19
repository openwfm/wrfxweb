from ..api import db
from ..models.Catalog import Catalog
import datetime


def create_catalog(name, description):
    new_catalog = Catalog(
        name=name,
        description=description,
        date_created=datetime.datetime.now().strftime("%Y-%m-%d"),
    )
    db.session.add(new_catalog)
    db.session.commit()
    return new_catalog
