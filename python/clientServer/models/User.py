from clientServer.app import db, aesgcm
from clientServer.serverKeys import ENCRYPTION_NONCE
from flask_login import UserMixin


class User(UserMixin, db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    # encrypted_email = db.Column(db.String(254), nullable=True)
    encrypted_email = db.Column(db.LargeBinary)
    date_created = db.Column(db.String(10), nullable=False)

    def domain(self):
        return f"@{self.email().split('@')[1]}"

    def email(self):
        return aesgcm.decrypt(ENCRYPTION_NONCE, self.encrypted_email, b"").decode()

    def destroy(self):
        db.session.delete(self)
        db.session.commit()

    def __repr__(self):
        return f"<User {self.id}>"
