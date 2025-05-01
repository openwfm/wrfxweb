from api.session import db_session
from api.models.Admin import Admin
from api.models.User import User
from api.services import UserServices as UserServices
from api.apiKeys import ADMIN_SERVICES_API_KEY
from api.validators import AdminValidators as AdminValidators
from sqlalchemy import select

import datetime


def create(email):
    user = UserServices.find_or_create(email, ADMIN_SERVICES_API_KEY)
    if user == None:
        return None
    admin = find(user.id)
    if admin != None:
        return admin.user
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    admin = Admin(user_id=user.id, date_created=date)
    db_session.add(admin)
    db_session.commit()
    return user


def find(user_id):
    validated_user_id = AdminValidators.validate_admin_id(user_id)
    return db_session.scalar(select(Admin).where(Admin.user_id == validated_user_id))


def find_by_admin_id(admin_id):
    try:
        validated_admin_id = AdminValidators.validate_admin_id(admin_id)
        return db_session.query(Admin).get(validated_admin_id)
    except:
        return None


def all_admins(user, admin_api_key):
    if not isAdmin(user, admin_api_key):
        return []
    admins = db_session.query(User).join(Admin).all()
    return admins


def isAdmin(user, admin_api_key):
    if admin_api_key != ADMIN_SERVICES_API_KEY:
        raise PermissionError("Invalid AdminServicesApiKey")
    return db_session.scalar(select(Admin).where(Admin.user_id == user.id)) is not None


def admin_destroy(admin_id, user, admin_api_key):
    if not isAdmin(user, admin_api_key):
        return
    admin = find_by_admin_id(admin_id)
    db_session.delete(admin)
    db_session.commit()


def admin_create(email, user, admin_api_key):
    try:
        if not isAdmin(user, admin_api_key):
            return None
        admin = create(email)
        return admin
    except:
        return None
