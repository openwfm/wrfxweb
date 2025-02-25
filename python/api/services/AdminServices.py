from api.db import db
from api.models.Admin import Admin
from api.services import UserServices as UserServices
from api.apiKeys import ADMIN_SERVICES_API_KEY

import datetime


# make private
def create(email):
    user = UserServices.find_or_create(email, ADMIN_SERVICES_API_KEY)
    if user == None:
        return None
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    admin = Admin(user_id=user.id, date_created=date)
    db.session.add(admin)
    db.session.commit()
    return user


def find(user_id):
    return db.session.scalar(db.select(Admin).where(Admin.user_id == user_id))


def destroy(email):
    user = UserServices.find(email)
    admin = find(user.id)
    db.session.delete(admin)
    db.session.commit()


def isAdmin(user, admin_api_key):
    if admin_api_key != ADMIN_SERVICES_API_KEY:
        raise PermissionError("Invalid AdminServicesApiKey")
    return (
        db.session.scalar(db.select(Admin).where(Admin.user_id == user.id)) is not None
    )


def admin_create(email, user, admin_api_key):
    try:
        if not isAdmin(user, admin_api_key):
            return None
        admin = create(email)
        return admin
    except:
        return None
