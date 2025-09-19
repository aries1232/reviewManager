# analytics.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import defaultdict
import json

from ..database import get_db
from ..models import Review as ReviewModel
from ..schemas import AnalyticsData

router = APIRouter()

@router.get("/analytics", response_model=AnalyticsData)
async def get_analytics(db: Session = Depends(get_db)):
    """
    Get analytics data including sentiment counts, topics, ratings, and location stats.
    
    Args:
        db: Database session
        
    Returns:
        Analytics data with various counts and distributions
    """
    try:
        # Get all reviews for analysis
        reviews = db.query(ReviewModel).all()
        
        if not reviews:
            return AnalyticsData(
                sentiment_counts={},
                topic_counts={},
                rating_distribution={},
                location_stats={}
            )
        
        # Initialize counters
        sentiment_counts = defaultdict(int)
        topic_counts = defaultdict(int)
        rating_distribution = defaultdict(int)
        location_stats = defaultdict(int)
        
        # Process each review
        for review in reviews:
            # Count sentiments
            if review.sentiment:
                sentiment_counts[review.sentiment] += 1
            
            # Count ratings
            rating_distribution[str(review.rating)] += 1
            
            # Count locations
            location_stats[review.location] += 1
            
            # Count topics
            if review.topics:
                try:
                    topics = json.loads(review.topics)
                    for topic in topics:
                        topic_counts[topic] += 1
                except (json.JSONDecodeError, TypeError):
                    pass  # Skip invalid topic data
        
        # Convert defaultdicts to regular dicts
        return AnalyticsData(
            sentiment_counts=dict(sentiment_counts),
            topic_counts=dict(topic_counts),
            rating_distribution=dict(rating_distribution),
            location_stats=dict(location_stats)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")