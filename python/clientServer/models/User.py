from clientServer.app import db
from flask_login import UserMixin
import api.encryption as encryption


class User(UserMixin, db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    encrypted_email = db.Column(db.LargeBinary)
    date_created = db.Column(db.String(10), nullable=False)

    def destroy(self):
        db.session.delete(self)
        db.session.commit()

    def email(self):
        return encryption.decrypt_user_data(self.encrypted_email)

    def __repr__(self):
        return f"<User {self.id}: {self.email()}>"
