from api.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship


class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date_created = Column(String(10), nullable=False)
    user = relationship("User", foreign_keys="Admin.user_id")

    def __repr__(self):
        return f"<Admin {self.user_id}>"
