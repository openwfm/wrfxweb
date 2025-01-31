from clientServer.app import db


class UserFeedback(db.Model):
    __tablename__ = "user_feedbacks"
    id = db.Column(db.Integer, primary_key=True)
    date_created = db.Column(db.String(10), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    organization = db.Column(db.String(100), nullable=False)
    contact = db.Column(db.String(100), nullable=True)
    featureOrBug = db.Column(db.String(7), nullable=True)
    title = db.Column(db.String(100), nullable=True)
    steps = db.Column(db.String(700), nullable=True)
    description = db.Column(db.String(700), nullable=True)
