from api.db import db
from api.models.Admin import Admin
from api.services import UserServices as UserServices
from api.apiKeys import ADMIN_SERVICES_API_KEY
from api.validators import utils as validationUtils
from api.validators import AdminValidators as AdminValidators

import datetime


# make private
def create(email):
    user = UserServices.find_or_create(email, ADMIN_SERVICES_API_KEY)
    if user == None:
        return None
    admin = find(user.id)
    if admin != None:
        return admin.user
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    admin = Admin(user_id=user.id, date_created=date)
    db.session.add(admin)
    db.session.commit()
    return user


def find(user_id):
    validated_user_id = AdminValidators.validate_admin_id(user_id)
    return db.session.scalar(db.select(Admin).where(Admin.user_id == validated_user_id))


def find_by_admin_id(admin_id):
    try:
        validated_admin_id = AdminValidators.validate_admin_id(admin_id)
        return Admin.query.get(validated_admin_id)
    except:
        return None


def isAdmin(user, admin_api_key):
    if admin_api_key != ADMIN_SERVICES_API_KEY:
        raise PermissionError("Invalid AdminServicesApiKey")
    return (
        db.session.scalar(db.select(Admin).where(Admin.user_id == user.id)) is not None
    )


def admin_destroy(admin_id, user, admin_api_key):
    if not isAdmin(user, admin_api_key):
        return
    admin = find_by_admin_id(admin_id)
    db.session.delete(admin)
    db.session.commit()


def admin_create(email, user, admin_api_key):
    try:
        if not isAdmin(user, admin_api_key):
            return None
        admin = create(email)
        return admin
    except:
        return None
