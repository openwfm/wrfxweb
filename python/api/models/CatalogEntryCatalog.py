from api.db import db


class CatalogEntryCatalog(db.Model):
    __tablename__ = "catalog_entry_catalog"
    id = db.Column(db.Integer, primary_key=True)
    catalog_id = db.Column(db.Integer, db.ForeignKey("catalog.id"), nullable=False)
    catalog_entry_id = db.Column(
        db.Integer, db.ForeignKey("catalog_entry.id"), nullable=False
    )
    catalog = db.relationship("Catalog", foreign_keys="CatalogEntryCatalog.catalog_id")
    catalog_entry = db.relationship(
        "CatalogEntry", foreign_keys="CatalogEntryCatalog.catalog_entry_id"
    )

    def destroy(self):
        db.session.delete(self)
        db.session.commit()

    def __repr__(self):
        return f"<CatalogEntryCatalog {self.id}: catalog_id: {self.catalog_id} catalog_entry_id: {self.catalog_entry_id}>"
