from api.db import Base
from sqlalchemy import Column, Integer, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship

import api.encryption as encryption


class WrfxctrlAccess(Base):
    __tablename__ = "wrfxctrl_access"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    encrypted_domain = Column(LargeBinary)
    user = relationship("User", foreign_keys="WrfxctrlAccess.user_id")

    def user_email(self):
        return self.user.email

    def permission_text(self):
        if self.user_id:
            return self.user.email()
        return self.domain()

    def domain(self):
        return encryption.decrypt_user_data(self.encrypted_domain)

    def permission_type(self):
        if self.user_id:
            return "user"
        return "domain"
