from api.db import db
from api.models.User import User
from api.apiKeys import USER_SERVICES_KEYS
from api.validators import utils as validationUtils
import api.encryption as encryption
import datetime


def create(email, user_services_key):
    if (
        not validationUtils.is_valid_email(email)
        or user_services_key not in USER_SERVICES_KEYS
    ):
        return None
    email_cipher = encryption.encrypt_user_data(email)
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    user = User(encrypted_email=email_cipher, date_created=date)
    db.session.add(user)
    db.session.commit()
    return user


def find_or_create(email, user_services_key):
    user = find(email)
    if user is None:
        user = create(email, user_services_key)
    return user


def find(email):
    email_cipher = encryption.encrypt_user_data(email)
    return db.session.scalar(
        db.select(User).where(User.encrypted_email == email_cipher)
    )


def find_by_id(user_id):
    return User.query.get(user_id)
