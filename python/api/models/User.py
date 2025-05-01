from api.db import Base
from flask_login import UserMixin
from sqlalchemy import Integer, Column, LargeBinary, String
import api.encryption as encryption


class User(UserMixin, Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    encrypted_email = Column(LargeBinary)
    date_created = Column(String(10), nullable=False)

    def domain(self):
        return f"@{self.email().split('@')[1]}"

    def email(self):
        return encryption.decrypt_user_data(self.encrypted_email)

    def __repr__(self):
        return f"<User {self.id}>"
