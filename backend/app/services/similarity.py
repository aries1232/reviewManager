"""Similarity search service using TF-IDF and cosine similarity."""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List, Tuple
import logging

logger = logging.getLogger(__name__)

class SimilarityService:
    """Service for finding similar reviews using TF-IDF and cosine similarity."""
    
    def __init__(self):
        """Initialize the similarity service."""
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            lowercase=True,
            ngram_range=(1, 2)  # Include unigrams and bigrams
        )
        self.tfidf_matrix = None
        self.reviews_data = []
    
    def build_index(self, reviews: List[dict]):
        """
        Build TF-IDF index from reviews.
        
        Args:
            reviews: List of review dictionaries with 'id' and 'review_text'
        """
        if not reviews:
            logger.warning("No reviews provided for building similarity index")
            return
        
        try:
            #Extract review texts
            texts = [review['review_text'] for review in reviews]
            self.reviews_data = reviews
            
            #Build TF-IDF matrix
            self.tfidf_matrix = self.vectorizer.fit_transform(texts)
            
            logger.info(f"Built similarity index with {len(reviews)} reviews")
            
        except Exception as e:
            logger.error(f"Failed to build similarity index: {e}")
            self.tfidf_matrix = None
            self.reviews_data = []
    
    def find_similar(self, query: str, k: int = 5) -> List[Tuple[int, float]]:
        """
        Find k most similar reviews to the query.
        
        Args:
            query: Search query text
            k: Number of similar reviews to return
            
        Returns:
            List of tuples (review_id, similarity_score)
        """
        if self.tfidf_matrix is None or not self.reviews_data:
            logger.warning("Similarity index not built. Call build_index first.")
            return []
        
        try:
            # Transform query using the same vectorizer
            query_vector = self.vectorizer.transform([query])
            
            # Calculate cosine similarity
            similarity_scores = cosine_similarity(query_vector, self.tfidf_matrix).flatten()
            
            # Get top k similar reviews
            top_indices = np.argsort(similarity_scores)[::-1][:k]
            
            results = []
            for idx in top_indices:
                if similarity_scores[idx] > 0:  # Only include non-zero similarities
                    review_id = self.reviews_data[idx]['id']
                    score = float(similarity_scores[idx])
                    results.append((review_id, score))
            
            return results
            
        except Exception as e:
            logger.error(f"Similarity search failed: {e}")
            return []
    
    def get_index_stats(self) -> dict:
        """Get statistics about the similarity index."""
        return {
            'total_reviews': len(self.reviews_data),
            'vocabulary_size': len(self.vectorizer.vocabulary_) if self.tfidf_matrix is not None else 0,
            'index_built': self.tfidf_matrix is not None
        }
    
    def initialize_from_database(self, db_session):
        """
        Initialize the similarity index from existing reviews in the database.
        
        This method should be called on application startup to ensure the
        similarity search functionality works with existing data.
        
        Args:
            db_session: SQLAlchemy database session
        """
        try:
            # Import here to avoid circular imports
            from ..models import Review as ReviewModel
            
            # Get all existing reviews
            all_reviews = db_session.query(ReviewModel).all()
            
            if all_reviews:
                # Build similarity index
                reviews_for_index = [
                    {'id': r.id, 'review_text': r.review_text} 
                    for r in all_reviews
                ]
                self.build_index(reviews_for_index)
                logger.info(f"Similarity index initialized from database with {len(all_reviews)} reviews")
            else:
                logger.info("No existing reviews found in database, similarity index will be built when reviews are added")
                
        except Exception as e:
            logger.error(f"Failed to initialize similarity index from database: {e}")
            raise

# Global similarity service instance
similarity_service = SimilarityService()