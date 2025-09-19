"""Database configuration and session management."""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

#Create database directory if it doesn't exist
os.makedirs("data", exist_ok=True)

#SQLite database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./data/reviews.db"

# Create engine with check_same_thread=False for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

#Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#Create base class for models
Base = declarative_base()

def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)