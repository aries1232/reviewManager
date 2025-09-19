#schemas for request/response validation. 

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ReviewBase(BaseModel):
    business_name: str = Field(..., min_length=1, max_length=255)
    location: str = Field(..., min_length=1, max_length=255)
    customer_name: str = Field(..., min_length=1, max_length=255)
    rating: int = Field(..., ge=1, le=5)
    review_text: str = Field(..., min_length=1)
    date: str = Field(..., min_length=1)

class ReviewCreate(ReviewBase):
    """Schema for creating new reviews."""
    pass

class Review(ReviewBase):
    """Complete review schema with all fields."""
    id: int
    sentiment: Optional[str] = None
    sentiment_score: Optional[float] = None
    topics: Optional[List[str]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ReviewFilters(BaseModel):
    """Schema for filtering reviews."""
    location: Optional[str] = None
    sentiment: Optional[str] = None
    search: Optional[str] = None
    page: int = Field(1, ge=1)
    limit: int = Field(10, ge=1, le=100)

class ReviewsResponse(BaseModel):
    """Schema for paginated reviews response."""
    reviews: List[Review]
    total: int
    page: int
    pages: int

class IngestResponse(BaseModel):
    message: str
    count: int

class SuggestedReply(BaseModel):
    """Schema for AI-generated reply suggestions."""
    reply: str
    tone: str
    key_points: List[str]

class AnalyticsData(BaseModel):
    """Schema for analytics data."""
    sentiment_counts: Dict[str, int]
    topic_counts: Dict[str, int]
    rating_distribution: Dict[str, int]
    location_stats: Dict[str, int]

class SimilarReviewsResponse(BaseModel):
    similar_reviews: List[Review]
    query: str

class HealthResponse(BaseModel):
    """Schema for health check response."""
    status: str
    message: str