from ..app import db
from ..models.Admin import Admin

from . import UserServices as UserServices

import datetime


def create(email):
    user = UserServices.find_or_create(email)
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    admin = Admin(user_id=user.id, date_created=date)
    db.session.add(admin)
    db.session.commit()
    return admin


def find(user_id):
    return db.session.scalar(db.select(Admin).where(Admin.user_id == user_id))


def destroy(email):
    user = UserServices.find(email)
    admin = find(user.id)
    db.session.delete(admin)
    db.session.commit()


def isAdmin(user):
    return (
        db.session.scalar(db.select(Admin).where(Admin.user_id == user.id)) is not None
    )
