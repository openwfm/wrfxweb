from api.db import Base

from sqlalchemy import Column, Integer, String


class UserFeedback(Base):
    __tablename__ = "user_feedbacks"
    id = Column(Integer, primary_key=True)
    date_created = Column(String(10), nullable=False)
    full_name = Column(String(100), nullable=False)
    organization = Column(String(100), nullable=False)
    contact = Column(String(100), nullable=True)
    featureOrBug = Column(String(7), nullable=True)
    title = Column(String(100), nullable=True)
    steps = Column(String(700), nullable=True)
    description = Column(String(700), nullable=True)
