from ..app import db
from ..models.User import User
import datetime


def create(email):
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    user = User(email=email, username=email.split("@")[0], date_created=date)
    db.session.add(user)
    db.session.commit()
    return user


def find_or_create(email):
    user = db.session.scalar(db.select(User).where(User.email == email))
    if user is None:
        user = create_user(email)
    return user
