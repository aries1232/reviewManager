from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
import json
import math

from ..database import get_db
from ..models import Review as ReviewModel
from ..schemas import (
    Review, ReviewCreate, ReviewFilters, ReviewsResponse, 
    IngestResponse, SuggestedReply, SimilarReviewsResponse
)
from ..services.ai import ai_service
from ..services.similarity import similarity_service

router = APIRouter()

@router.post("/ingest", response_model=IngestResponse)
async def ingest_reviews(reviews: List[ReviewCreate], db: Session = Depends(get_db)):
    """
    Ingest a batch of reviews into the database.
    """
    try:
        processed_reviews = []
        
        for review_data in reviews:
            # Analyze sentiment and extract topics
            sentiment, sentiment_score = ai_service.analyze_sentiment(review_data.review_text)
            topics = ai_service.extract_topics(review_data.review_text)
            
            # Create review model instance
            db_review = ReviewModel(
                business_name=review_data.business_name,
                location=review_data.location,
                customer_name=review_data.customer_name,
                rating=review_data.rating,
                review_text=review_data.review_text,
                date=review_data.date,
                sentiment=sentiment,
                sentiment_score=sentiment_score,
                topics=json.dumps(topics)  # Store as JSON string
            )
            
            processed_reviews.append(db_review)
        
        #Add all reviews to database
        db.add_all(processed_reviews)
        db.commit()
        
        #Rebuild similarity index with new  data
        all_reviews =db.query(ReviewModel).all()
        reviews_for_index = [
            {'id': r.id, 'review_text': r.review_text} 
            for r in all_reviews
        ]
        similarity_service.build_index(reviews_for_index)
        
        return IngestResponse(
            message=f"Successfully ingested {len(processed_reviews)} reviews",
            count=len(processed_reviews)
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to ingest reviews: {str(e)}")

@router.get("/reviews", response_model=ReviewsResponse)
async def get_reviews(
    location: Optional[str] = Query(None, description="Filter by location"),
    sentiment: Optional[str] = Query(None, description="Filter by sentiment"),
    search: Optional[str] = Query(None, description="Search in review text"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Get reviews with filtering and pagination.
    
    Args:
        location: Optional location filter
        sentiment: Optional sentiment filter
        search: Optional text search
        page: Page number (1-based)
        limit: Number of items per page
        db: Database session
        
    Returns:
        Paginated reviews response
    """
    try:
        #Build query with filters
        query = db.query(ReviewModel)
        
        #Apply filters
        filters = []
        if location:
            filters.append(ReviewModel.location == location)
        if sentiment:
            filters.append(ReviewModel.sentiment == sentiment)
        if search:
            # Search across multiple fields: review text, customer name, and business name
            search_filter = or_(
                ReviewModel.review_text.ilike(f"%{search}%"),
                ReviewModel.customer_name.ilike(f"%{search}%"),
                ReviewModel.business_name.ilike(f"%{search}%")
            )
            filters.append(search_filter)
        
        if filters:
            query = query.filter(and_(*filters))
        
        #Get total count
        total = query.count()
        
        #Apply pagination
        offset = (page - 1) * limit
        reviews = query.order_by(ReviewModel.created_at.desc()).offset(offset).limit(limit).all()
        
        #Convert to response format
        review_responses = []
        for review in reviews:
            topics = json.loads(review.topics) if review.topics else [] # type: ignore
            review_dict = {
                "id": review.id,
                "business_name": review.business_name,
                "location": review.location,
                "customer_name": review.customer_name,
                "rating": review.rating,
                "review_text": review.review_text,
                "date": review.date,
                "sentiment": review.sentiment,
                "sentiment_score": review.sentiment_score,
                "topics": topics,
                "created_at": review.created_at
            }
            review_responses.append(Review(**review_dict))
        
        pages = math.ceil(total / limit) if total > 0 else 1
        
        return ReviewsResponse(
            reviews=review_responses,
            total=total,
            page=page,
            pages=pages
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reviews: {str(e)}")

@router.get("/reviews/{review_id}", response_model=Review)
async def get_review(review_id: int, db: Session = Depends(get_db)):
    """
    Get a single review by ID.
    
    Args:
        review_id: Review ID
        db: Database session
        
    Returns:
        Review details
    """
    review = db.query(ReviewModel).filter(ReviewModel.id == review_id).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    topics = json.loads(review.topics) if review.topics else [] # type: ignore
    
    review_dict = {
        "id": review.id,
        "business_name": review.business_name,
        "location": review.location,
        "customer_name": review.customer_name,
        "rating": review.rating,
        "review_text": review.review_text,
        "date": review.date,
        "sentiment": review.sentiment,
        "sentiment_score": review.sentiment_score,
        "topics": topics,
        "created_at": review.created_at
    }
    
    return Review(**review_dict)

@router.post("/reviews/{review_id}/suggest-reply", response_model=SuggestedReply)
async def suggest_reply(review_id: int, db: Session = Depends(get_db)):
    """
    Generate AI-powered reply suggestion for a review.
    
    Args:
        review_id: Review ID
        db: Database session
        
    Returns:
        Suggested reply with metadata
    """
    review = db.query(ReviewModel).filter(ReviewModel.id == review_id).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    try:
        # Generate reply suggestion using AI service
        suggestion = ai_service.suggest_reply(
            review.review_text, # type: ignore
            review.rating, # type: ignore
            review.sentiment or 'neutral' # type: ignore
        )
        
        return SuggestedReply(**suggestion)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate reply: {str(e)}")

@router.get("/search", response_model=SimilarReviewsResponse)
async def search_similar_reviews(
    q: str = Query(..., description="Search query"),
    k: int = Query(5, ge=1, le=20, description="Number of similar reviews to return"),
    db: Session = Depends(get_db)
):
    """
    Find reviews similar to the search query using TF-IDF similarity.
    """
    try:
        # Find similar review IDs using similarity service
        similar_ids_scores = similarity_service.find_similar(q, k)
        
        if not similar_ids_scores:
            return SimilarReviewsResponse(similar_reviews=[], query=q)
        
        # Get review IDs
        review_ids = [item[0] for item in similar_ids_scores]
        
        # Fetch reviews from database
        reviews = db.query(ReviewModel).filter(ReviewModel.id.in_(review_ids)).all()
        
        # Sort by similarity score and convert to response format
        id_to_review = {r.id: r for r in reviews}
        sorted_reviews = []
        
        for review_id, score in similar_ids_scores:
            if review_id in id_to_review:
                review = id_to_review[review_id] # type: ignore
                topics = json.loads(review.topics) if review.topics else [] # type: ignore
                
                review_dict = {
                    "id": review.id,
                    "business_name": review.business_name,
                    "location": review.location,
                    "customer_name": review.customer_name,
                    "rating": review.rating,
                    "review_text": review.review_text,
                    "date": review.date,
                    "sentiment": review.sentiment,
                    "sentiment_score": review.sentiment_score,
                    "topics": topics,
                    "created_at": review.created_at
                }
                sorted_reviews.append(Review(**review_dict))
        
        return SimilarReviewsResponse(similar_reviews=sorted_reviews, query=q)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/locations")
async def get_locations(db: Session = Depends(get_db)):
    """
    Get all unique locations from reviews.
    """
    try:
        # Query for distinct locations
        locations = db.query(ReviewModel.location).distinct().all()
        # Extract location strings and filter out None values
        unique_locations = [loc[0] for loc in locations if loc[0]]
        # Sort alphabetically
        unique_locations.sort()
        return {"locations": unique_locations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch locations: {str(e)}")