from api.apiKeys import DB_INSTANCE
from sqlalchemy import create_engine

from sqlalchemy.ext.declarative import declarative_base


engine = create_engine(f"sqlite:///{DB_INSTANCE}")
Base = declarative_base()
