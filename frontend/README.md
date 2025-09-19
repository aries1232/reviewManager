# Customer Reviews Management System

A full-stack application for managing customer reviews with AI-powered sentiment analysis, similarity search, and automated reply generation.

## 🌟 Features

### Backend (FastAPI + Python)
- **Review Management**: Ingest, store, and retrieve customer reviews with filtering and pagination
- **AI-Powered Analysis**: Automatic sentiment analysis and topic extraction using Hugging Face models
- **Smart Search**: TF-IDF-based similarity search for finding related reviews
- **Reply Generation**: AI-generated suggested replies tailored to review sentiment and content
- **Analytics Dashboard**: Comprehensive insights with sentiment distribution, topic analysis, and location stats
- **API Documentation**: Auto-generated Swagger documentation at `/docs`

### Frontend (React + Vite)
- **Review Inbox**: Clean table view with advanced filtering and search capabilities
- **Review Details**: Detailed view with AI-generated reply suggestions and similar reviews
- **Analytics Dashboard**: Interactive charts showing sentiment trends, rating distribution, and key insights
- **Responsive Design**: Optimized for mobile, tablet, and desktop viewing
- **Modern UI**: Clean design with smooth animations and intuitive navigation

## 🚀 Quick Start

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the FastAPI server**
   ```bash
   uvicorn app.main:app --reload
   ```

   The API will be available at:
   - **API**: http://localhost:8000
   - **Documentation**: http://localhost:8000/docs
   - **Health Check**: http://localhost:8000/health

### Frontend Setup

1. **Navigate to frontend directory (project root)**
   ```bash
   cd frontend  # or stay in project root
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

   The frontend will be available at http://localhost:5173

## 📁 Project Structure

```
project/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI application entry point
│   │   ├── models.py       # SQLAlchemy database models
│   │   ├── schemas.py      # Pydantic request/response schemas
│   │   ├── database.py     # Database configuration
│   │   ├── routes/         # API route handlers
│   │   │   ├── reviews.py  # Review-related endpoints
│   │   │   └── analytics.py # Analytics endpoints
│   │   └── services/       # Business logic services
│   │       ├── ai.py       # AI sentiment analysis & reply generation
│   │       └── similarity.py # TF-IDF similarity search
│   ├── tests/              # Test cases
│   └── requirements.txt    # Python dependencies
└── frontend/               # React frontend (project root)
    ├── src/
    │   ├── pages/          # React page components
    │   │   ├── ReviewsTable.jsx    # Main reviews list
    │   │   ├── ReviewDetail.jsx    # Individual review view
    │   │   └── Analytics.jsx       # Analytics dashboard
    │   ├── api/            # API client
    │   │   └── api.js      # Backend communication
    │   └── App.jsx         # Main React application
    └── package.json        # Node.js dependencies
```

## 🔧 API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `POST /ingest` - Upload JSON array of reviews
- `GET /reviews` - Get reviews with filtering and pagination
- `GET /reviews/{id}` - Get single review details
- `POST /reviews/{id}/suggest-reply` - Generate AI-powered reply
- `GET /analytics` - Get comprehensive analytics data
- `GET /search?q=query&k=5` - Find similar reviews using TF-IDF

### Sample Review Data Format
```json
[
  {
    "business_name": "Joe's Pizza",
    "location": "Downtown",
    "customer_name": "John Doe",
    "rating": 5,
    "review_text": "Amazing pizza and excellent service!",
    "date": "2024-01-15"
  }
]
```

## 🤖 AI Features

### Sentiment Analysis
- **Model**: `cardiffnlp/twitter-roberta-base-sentiment-latest`
- **Output**: Classifies reviews as positive, negative, or neutral
- **Confidence Scores**: Provides sentiment confidence scores (-1 to +1)

### Topic Extraction
- **Method**: Rule-based keyword matching
- **Topics**: Food quality, service, atmosphere, price, delivery, cleanliness, etc.
- **Output**: Up to 3 relevant topics per review

### Reply Generation
- **Model**: `google/flan-t5-small`
- **Adaptive Tone**: Grateful, apologetic, or professional based on sentiment
- **Key Points**: Identifies main issues to address in the reply
- **Fallback**: Template-based replies when AI generation fails

## 🔍 Search Technology

- **TF-IDF Vectorization**: Converts review text to numerical features
- **Cosine Similarity**: Measures semantic similarity between reviews
- **Real-time Indexing**: Updates search index when new reviews are added
- **Configurable Results**: Return top-k similar reviews (default: 5)

## 📊 Analytics Features

- **Sentiment Distribution**: Visual breakdown of positive, negative, and neutral reviews
- **Rating Analysis**: Distribution of star ratings across all reviews
- **Topic Insights**: Most frequently discussed topics and themes
- **Location Performance**: Review counts and performance by business location
- **Key Metrics**: Total reviews, average rating, positive percentage

## 🧪 Testing

Run backend tests:
```bash
cd backend
python -m pytest tests/ -v
```

Tests include:
- ✅ Health check endpoint validation
- ✅ Successful review ingestion (happy path)
- ❌ Invalid payload handling (error path)
- 📊 Analytics data retrieval
- 🔍 Similarity search functionality

## 🎨 Design Features

- **Modern UI**: Clean, professional design with subtle shadows and rounded corners
- **Responsive Layout**: Optimized for mobile, tablet, and desktop
- **Interactive Elements**: Hover states, smooth transitions, and loading indicators
- **Color System**: Consistent color palette with semantic meaning
- **Typography**: Clear hierarchy with proper spacing and readability
- **Accessibility**: Semantic HTML and keyboard navigation support

## 🔧 Configuration

### Environment Variables
The backend automatically configures:
- **CORS**: Enabled for frontend communication
- **Database**: SQLite with automatic table creation
- **AI Models**: Loaded on startup with fallback handling
- **Search Index**: Built automatically when reviews are added

### Customization Options
- **AI Models**: Modify `services/ai.py` to use different Hugging Face models
- **Search Parameters**: Adjust TF-IDF settings in `services/similarity.py`
- **UI Theme**: Update colors and styling in Tailwind CSS classes
- **API Endpoints**: Add new routes in the `routes/` directory

## 📈 Performance Notes

- **Model Loading**: AI models loaded once at startup for optimal performance
- **Database Indexing**: Optimized queries with proper database indexes
- **Search Caching**: Similarity index rebuilt only when new reviews are added
- **Response Streaming**: Large datasets handled with pagination
- **Error Resilience**: Graceful fallbacks when AI services are unavailable

## 🚀 Deployment

### Backend Deployment
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend Deployment
```bash
npm run build
# Deploy dist/ folder to your preferred hosting service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

- **API Documentation**: Visit http://localhost:8000/docs when running locally
- **Issues**: Report bugs and feature requests in the project issues
- **Testing**: Run the test suite to verify functionality

---

Built with ❤️ using FastAPI, React, and modern AI technologies.