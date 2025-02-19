from clientServer.app import db, aesgcm
from clientServer.models.User import User
from clientServer.serverKeys import ENCRYPTION_KEY, ENCRYPTION_NONCE
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
