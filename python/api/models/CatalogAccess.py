from clientServer.app import db, aesgcm
from clientServer.serverKeys import ENCRYPTION_NONCE


class CatalogAccess(db.Model):
    __tablename__ = "catalog_access"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    catalog_id = db.Column(db.Integer, db.ForeignKey("catalog.id"), nullable=False)
    encrypted_domain = db.Column(db.LargeBinary)
    user = db.relationship("User", foreign_keys="CatalogAccess.user_id")

    def user_email(self):
        return self.user.email

    def permission_text(self):
        if self.user_id:
            return self.user.email()
        return self.domain()

    def domain(self):
        return aesgcm.decrypt(ENCRYPTION_NONCE, self.encrypted_domain, b"").decode()

    def permission_type(self):
        if self.user_id:
            return "user"
        return "domain"

    def destroy(self):
        db.session.delete(self)
        db.session.commit()
