from clientServer.app import db
from clientServer.models.CatalogAccess import CatalogAccess
from clientServer.models.CatalogEntry import CatalogEntry

from sqlalchemy import or_, select


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

    def user_has_access(self, user):
        if self.public:
            return True

        any_access_query = select(CatalogAccess).where(
            or_(
                CatalogAccess.user_id == user.id,
                CatalogAccess.domain == user.domain(),
            )
        )
        return db.session.execute(any_access_query).first() != None

    def __repr__(self):
        return f"<Catalog {self.id}: public: {self.public}>"
