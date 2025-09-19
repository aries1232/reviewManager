from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import  logging

from .database import create_tables, get_db
from .routes import reviews, analytics
from .schemas import HealthResponse
from .services.similarity import similarity_service

#logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app =  FastAPI(
    title="Customer Reviews Management API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

#Add cors 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#routers
app.include_router(reviews.router, tags=["reviews"])
app.include_router(analytics.router, tags=["analytics"])

@app.on_event("startup")
async def startup_event():
    """Initialize application services on startup."""
    logger.info("Application starting up...")
    try:
        #initialize similarity index from db
        db = next(get_db())
        similarity_service.initialize_from_database(db)
        db.close()

        logger.info("application started successfully")
    except Exception as e:
        logger.error(f"Application startup failed: {e}")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check.
    """
    return HealthResponse(
        status="healthy",
        message="backend is running"
    )

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "customer  reviews management API",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)