# Customer Reviews Management API

A FastAPI-based backend service for managing customer reviews with AI-powered sentiment analysis and similarity search.

## Features

- **Review Management**: Ingest, store, and retrieve customer reviews
- **AI-Powered Analysis**: Sentiment analysis and topic extraction using Hugging Face models
- **Smart Search**: TF-IDF-based similarity search for finding related reviews
- **Reply Generation**: AI-generated suggested replies to customer reviews
- **Analytics**: Comprehensive analytics dashboard with sentiment and topic insights
- **API Documentation**: Auto-generated Swagger docs at `/docs`

## Quick Start

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Server**
   ```bash
   uvicorn app.main:app --reload
   ```

3. **Access the API**
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs
   - Health: http://localhost:8000/health

## API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `POST /ingest` - Upload reviews (JSON array)
- `GET /reviews` - Get reviews with filtering and pagination
- `GET /reviews/{id}` - Get single review
- `POST /reviews/{id}/suggest-reply` - Generate AI reply
- `GET /analytics` - Get analytics data
- `GET /search?q=query&k=5` - Find similar reviews

### Review Ingestion Format

```json
[
  {
    "business_name": "Joe's Pizza",
    "location": "Downtown",
    "customer_name": "John Doe",
    "rating": 5,
    "review_text": "Amazing pizza and great service!",
    "date": "2024-01-15"
  }
]
```

## AI Services

### Sentiment Analysis
- Uses `cardiffnlp/twitter-roberta-base-sentiment-latest` model
- Classifies reviews as positive, negative, or neutral
- Provides confidence scores

### Reply Generation
- Uses `google/flan-t5-small` for text generation
- Adapts tone based on review sentiment and rating
- Provides key points to address

### Topic Extraction
- Rule-based topic extraction using keyword matching
- Identifies common themes like food quality, service, atmosphere

## Search & Similarity

- **TF-IDF Vectorization**: Converts review text to numerical features
- **Cosine Similarity**: Finds semantically similar reviews
- **Real-time Search**: Updates search index when new reviews are added

## Database Schema

SQLite database with the following schema:

```sql
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL,
    review_text TEXT NOT NULL,
    date VARCHAR(50) NOT NULL,
    sentiment VARCHAR(50),
    sentiment_score FLOAT,
    topics TEXT,  -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Testing

Run tests with pytest:

```bash
cd backend
python -m pytest tests/ -v
```

## Configuration

The API automatically configures:
- CORS for frontend communication
- Database creation on startup
- AI model loading
- Similarity search indexing

## Error Handling

- Comprehensive error handling with appropriate HTTP status codes
- Fallback mechanisms for AI services
- Graceful degradation when models fail to load

## Performance Notes

- AI models are loaded once at startup
- Similarity search index is rebuilt when new reviews are added
- Database queries are optimized with indexes
- Text preprocessing for better search accuracy

## Development

1. **Project Structure**
   ```
   backend/
   ├── app/
   │   ├── main.py          # FastAPI application
   │   ├── models.py        # SQLAlchemy models
   │   ├── schemas.py       # Pydantic schemas
   │   ├── database.py      # Database configuration
   │   ├── routes/          # API route handlers
   │   └── services/        # AI and search services
   ├── tests/               # Test cases
   └── requirements.txt     # Dependencies
   ```

2. **Adding New Features**
   - Add new routes in `routes/` directory
   - Define schemas in `schemas.py`
   - Update models in `models.py` if needed
   - Add tests in `tests/` directory

3. **AI Model Customization**
   - Modify `services/ai.py` to use different models
   - Update model configurations in the AIService class
   - Test with various input types and edge cases