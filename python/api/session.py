from api.db import Base, engine
from sqlalchemy.orm import sessionmaker

from api import models


Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
db_session = Session()
