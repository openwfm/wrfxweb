from clientServer.app import db


class Admin(db.Model):
    __tablename__ = "admins"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    date_created = db.Column(db.String(10), nullable=False)

    def __repr__(self):
        return f"<Admin {self.user_id}>"
