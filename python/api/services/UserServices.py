from api.db import db
from api.models.User import User
import api.encryption as encryption
import datetime


def create(email):
    email_cipher = encryption.encrypt_user_data(email.encode())
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    user = User(encrypted_email=email_cipher, date_created=date)
    db.session.add(user)
    db.session.commit()
    return user


def find_or_create(email):
    user = find(email)
    if user is None:
        user = create(email)
    return user


def find(email):
    email_cipher = encryption.encrypt_user_data(email.encode())
    return db.session.scalar(
        db.select(User).where(User.encrypted_email == email_cipher)
    )


def find_by_id(user_id):
    return User.query.get(user_id)
