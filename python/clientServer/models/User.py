from ..app import db
from flask_login import UserMixin


class User(UserMixin, db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), nullable=False)
    email = db.Column(db.String(64), nullable=True)
    date_created = db.Column(db.String(10), nullable=False)
    # type = db.Column(db.String(64), nullable=False)
    #
    # __mapper_args__ = {
    #     "polymorphic_on": type,
    #     "polymorphic_identity": "user",
    # }

    def __repr__(self):
        return f"<User {self.username}>"


# class AdminUser(User):
#     __tablename__ = "admin_users"
#
#     __mapper_args__ = {
#         "polymorphic_identity": "admin",
#     }
#
#     def __repr__(self):
#         return f"<AdminUser {self.username}>"
