from api.db import Base
from sqlalchemy import Column, Integer, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship

import api.encryption as encryption


class CatalogAccess(Base):
    __tablename__ = "catalog_access"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    catalog_id = Column(Integer, ForeignKey("catalog.id"), nullable=False)
    encrypted_domain = Column(LargeBinary)
    user = relationship("User", foreign_keys="CatalogAccess.user_id")

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
