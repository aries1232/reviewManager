#SQLAlchemy models for the database.

from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from .database import Base

class Review(Base):
    """Review model representing customer reviews."""
    
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    business_name = Column(String(255), nullable=False, index=True)
    location = Column(String(255), nullable=False, index=True)
    customer_name = Column(String(255), nullable=False)
    rating = Column(Integer, nullable=False)
    review_text = Column(Text, nullable=False)
    date = Column(String(50), nullable=False)
    sentiment = Column(String(50), nullable=True, index=True)
    sentiment_score = Column(Float, nullable=True)
    topics = Column(Text, nullable=True)  # JSON string of topics
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Review(id={self.id}, business='{self.business_name}', rating={self.rating})>"