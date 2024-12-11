from ..api import db


class CatalogAccess(db.Model):
    __tablename__ = "catalog_access"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    catalog_id = db.Column(db.Integer, db.ForeignKey("catalog.id"))
    domain = db.Column(db.String(255))
