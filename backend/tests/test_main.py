import pytest # type: ignore
from fastapi.testclient import TestClient
import json
import sys
import os

#add backend app to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.main import  app

client = TestClient(app)

def test_health_check():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_root_endpoint():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data

#Happy path test-successful review ingestion
def test_ingest_reviews_success():
    """Test successful review ingestion."""
    sample_reviews = [
        {
            "business_name": "Test Restaurant",
            "location": "Test Location",
            "customer_name": "John Doe",
            "rating": 5,
            "review_text": "Great food and excellent service!",
            "date": "2024-01-15"
        },
        {
            "business_name": "Test Restaurant",
            "location": "Test Location",
            "customer_name": "Jane Smith",
            "rating": 4,
            "review_text": "Good experience overall, will come back.",
            "date": "2024-01-14"
        }
    ]
    
    response = client.post("/ingest", json=sample_reviews)
    assert response.status_code == 200
    
    data = response.json()
    assert "message" in data
    assert data["count"] == 2

#Error path test - invalid review payload
def test_ingest_reviews_invalid_payload():
    """Test review ingestion with invalid payload."""
    invalid_reviews = [
        {
            "business_name": "",  #Empty business name
            "location": "Test Location",
            "customer_name": "John Doe",
            "rating": 6,  #Invalid rating (should be 1-5)
            "review_text": "",  #Empty review text
            "date": "2024-01-15"
        }
    ]
    
    response = client.post("/ingest", json=invalid_reviews)
    assert response.status_code == 422  # Validation error

def test_get_reviews():
    """Test getting reviews with pagination."""
    response = client.get("/reviews?page=1&limit=10")
    assert response.status_code == 200
    
    data = response.json()
    assert "reviews" in data
    assert "total" in data
    assert "page" in data
    assert "pages" in data

def test_get_analytics():
    """Test analytics endpoint."""
    response = client.get("/analytics")
    assert response.status_code == 200
    
    data = response.json()
    assert "sentiment_counts" in data
    assert "topic_counts" in data
    assert "rating_distribution" in data
    assert "location_stats" in data

def test_search_similar_reviews():
    """Test similarity search."""
    response = client.get("/search?q=great food&k=5")
    assert response.status_code == 200
    
    data = response.json()
    assert "similar_reviews" in data
    assert "query" in data
    assert data["query"] == "great food"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])