from clientServer.app import db
from clientServer.models.CatalogAccess import CatalogAccess
from clientServer.models.CatalogEntry import CatalogEntry


class Catalog(db.Model):
    __tablename__ = "catalog"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    date_created = db.Column(db.String(10), nullable=False)
    public = db.Column(db.Boolean, default=False)

    def permissions(self):
        return CatalogAccess.query.filter_by(catalog_id=self.id).all()

    def entries(self):
        return CatalogEntry.query.filter_by(catalog_id=self.id).all()
