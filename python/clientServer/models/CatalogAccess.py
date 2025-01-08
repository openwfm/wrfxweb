from ..app import db


class CatalogAccess(db.Model):
    __tablename__ = "catalog_access"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    catalog_id = db.Column(db.Integer, db.ForeignKey("catalog.id"), nullable=False)
    domain = db.Column(db.String(255))

    def user_email(self):
        return self.user.email

    def permission_text(self):
        if self.user_id:
            return self.user.email
        return self.domain

    def permission_type(self):
        if self.user_id:
            return "user"
        return "domain"
