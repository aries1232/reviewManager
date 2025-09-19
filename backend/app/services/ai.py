"""AI services for sentiment analysis and reply generation."""

from transformers import pipeline, AutoTokenizer
import logging
from typing import List, Dict, Tuple
import json
import requests
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file in backend directory
backend_dir = Path(__file__).parent.parent.parent
env_file = backend_dir / '.env'
load_dotenv(env_file)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIService:
    """Service class for AI-powered features."""
    
    def __init__(self):
        """Initialize AI models."""
        try:
            #Sentiment analysis pipeline
            self.sentiment_analyzer = pipeline(
                "sentiment-analysis", # type: ignore
                model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                tokenizer="cardiffnlp/twitter-roberta-base-sentiment-latest"
            ) # type: ignore
            
            #AI API configuration
            self.perplexity_api_key = os.getenv('PERPLEXITY_API_KEY')
            self.perplexity_endpoint = "https://api.perplexity.ai/chat/completions"
            
            logger.info("AI models loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load AI models: {e}")
            # Fallback to None if models can't be loaded
            self.sentiment_analyzer = None
            self.perplexity_api_key = None
            self.perplexity_endpoint = None
    
    def analyze_sentiment(self, text: str) -> Tuple[str, float]:
        """
        Analyze sentiment of review text.
        
        Args:
            text: Review text to analyze
            
        Returns:
            Tuple of (sentiment_label, confidence_score)
        """
        if not self.sentiment_analyzer:
            # Fallback sentiment analysis
            return self._fallback_sentiment(text)
        
        try:
            #Truncate text if too long
            text = text[:500]
            
            result = self.sentiment_analyzer(text)[0]
            label = result['label'].lower()
            score = result['score']
            
            #Map labels to consistent format
            label_mapping = {
                'positive': 'positive',
                'negative': 'negative',
                'neutral': 'neutral'
            }
            
            mapped_label = label_mapping.get(label, 'neutral')
            
            #Convert score to sentiment score(-1 to 1)
            if mapped_label == 'positive':
                sentiment_score = score
            elif mapped_label == 'negative':
                sentiment_score = -score
            else:
                sentiment_score = 0.0
                
            return mapped_label, sentiment_score
            
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return self._fallback_sentiment(text)
    
    def _fallback_sentiment(self, text: str) -> Tuple[str, float]:
        """Simple fallback sentiment analysis."""
        text_lower = text.lower()
        
        positive_words = ['good', 'great', 'excellent', 'amazing', 'love', 'best', 'wonderful']
        negative_words = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointed']
        
        pos_count = sum(1 for word in positive_words if word in text_lower)
        neg_count = sum(1 for word in negative_words if word in text_lower)
        
        if pos_count > neg_count:
            return 'positive', 0.7
        elif neg_count > pos_count:
            return 'negative', -0.7
        else:
            return 'neutral', 0.0
    
    def extract_topics(self, text: str) -> List[str]:
        """
        Extract topics from review text using simple keyword matching.
        """
        text_lower = text.lower()
        
        # Define topic keywords
        topic_keywords = {
            'food quality': ['taste', 'flavor', 'delicious', 'fresh', 'quality', 'food'],
            'service': ['service', 'staff', 'waiter', 'waitress', 'server', 'friendly', 'rude'],
            'atmosphere': ['atmosphere', 'ambiance', 'music', 'noise', 'crowded', 'quiet'],
            'price': ['price', 'cost', 'expensive', 'cheap', 'value', 'money'],
            'delivery': ['delivery', 'arrived', 'late', 'fast', 'quick', 'slow'],
            'cleanliness': ['clean', 'dirty', 'hygiene', 'mess', 'tidy'],
            'location': ['location', 'parking', 'access', 'convenient', 'far'],
            'wait time': ['wait', 'waiting', 'long', 'quick', 'fast', 'slow']
        }
        
        identified_topics = []
        for topic, keywords in topic_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                identified_topics.append(topic)
        
        return identified_topics[:3]  #Return max 3 topics
    
    def suggest_reply(self, review_text: str, rating: int, sentiment: str) -> Dict[str, any]: # type: ignore
        """
        Generate a suggested reply to a customer review.
        Args:
            review_text: Original review text
            rating: Review rating (1-5)
            sentiment: Review sentiment (positive/negative/neutral)   
        Returns:
            Dictionary with reply suggestion and metadata
        """
        try:
            #Determine tone based on rating and sentiment
            tone = self._determine_tone(rating, sentiment)
            
            #Generate reply using Perplexity API or fallback
            if self.perplexity_api_key and self.perplexity_endpoint and len(review_text) < 400:
                reply = self.generate_ai_reply(
                    review_text, 
                    tone, 
                    rating,
                    max_tokens=200,
                    temperature=0.7,
                    model="sonar"
                )
            else:
                reply = self._generate_template_reply(rating, sentiment)
            
            #Extract key points to address
            key_points = self._extract_key_points(review_text, sentiment)
            
            return {
                'reply': reply,
                'tone': tone,
                'key_points': key_points
            }
            
        except Exception as e:
            logger.error(f"Reply generation failed: {e}")
            return self._fallback_reply(rating, sentiment)
    
    def _determine_tone(self, rating: int, sentiment: str) -> str:
        """Determine appropriate tone for reply."""
        if rating >= 4 and sentiment == 'positive':
            return 'grateful'
        elif rating <= 2 and sentiment == 'negative':
            return 'apologetic'
        else:
            return 'professional'
    
    def generate_ai_reply(
        self, 
        review_text: str, 
        tone: str, 
        rating: int,
        max_tokens: int = 200,
        temperature: float = 0.7,
        model: str = "llama-3.1-sonar-small-128k-chat",
        top_p: float = 1.0,
        presence_penalty: float = 0.0,
        frequency_penalty: float = 0.0
    ) -> str:
        """Generate reply using Perplexity API with customizable parameters."""
        try:
            #Check if API credentials are available
            if not self.perplexity_api_key or not self.perplexity_endpoint:
                logger.warning("Perplexity API credentials not available, using template reply")
                logger.warning(f"API Key present: {bool(self.perplexity_api_key)}")
                logger.warning(f"Endpoint: {self.perplexity_endpoint}")
                return self._generate_template_reply(rating, 'neutral')
            
            logger.info(f"API Key available: {self.perplexity_api_key[:10]}...")
            
            #Create a prompt for the AI
            prompt = f"""You are a professional restaurant manager responding to a customer review. 
                    Write a {tone} and helpful response to this {rating}-star review: "{review_text[:300]}"

                    Guidelines:
                    - Keep the response under 150 words
                    - Be genuine and specific to the review
                    - If it's a positive review, express gratitude
                    - If it's a negative review, acknowledge concerns and offer solutions
                    - Maintain a professional but warm tone
                    - Don't make promises you can't keep

                    Response:"""
            
            headers = {
                "Authorization": f"Bearer {self.perplexity_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model,
                "messages": [
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                "max_tokens": max_tokens,
                "temperature": temperature,
                "top_p": top_p,
                "presence_penalty": presence_penalty,
                "frequency_penalty": frequency_penalty
            }
            
            logger.info(f"Payload being sent: {json.dumps(payload, indent=2)}")
            logger.info(f"Calling Perplexity API with model: {model}")
            response = requests.post(
                self.perplexity_endpoint,
                json=payload,
                headers=headers,
                timeout=30
            )

            logger.info(f"ai response: {response}")
            
            logger.info(f"Perplexity API response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Perplexity API response: {result}")
                
                # Extract the reply from the response
                choices = result.get('choices', [])
                if choices and len(choices) > 0:
                    message = choices[0].get('message', {})
                    reply = message.get('content', '')
                    if reply:
                        return reply.strip()
                
                logger.warning("No content found in Perplexity response, using template")
                return self._generate_template_reply(rating, 'neutral')
            else:
                logger.error(f"Perplexity API error: {response.status_code} - {response.text}")
                return self._generate_template_reply(rating, 'neutral')
                
        except requests.exceptions.Timeout:
            logger.error("Perplexity API call timed out")
            return self._generate_template_reply(rating, 'neutral')
        except requests.exceptions.RequestException as e:
            logger.error(f"Perplexity API request failed: {e}")
            return self._generate_template_reply(rating, 'neutral')
        except Exception as e:
            logger.error(f"Perplexity API call failed: {e}")
            return self._generate_template_reply(rating, 'neutral')
    
    def _generate_template_reply(self, rating: int, sentiment: str) -> str:
        """Generate reply using templates."""
        if rating >= 4:
            return "Thank you so much for your wonderful review! We're thrilled to hear you had a great experience. We look forward to serving you again soon!"
        elif rating <= 2:
            return "Thank you for your feedback. We sincerely apologize for not meeting your expectations. We would love the opportunity to make this right. Please contact us directly so we can address your concerns."
        else:
            return "Thank you for taking the time to review us. We appreciate your feedback and are always working to improve our service. We hope to see you again soon!"
    
    def _extract_key_points(self, review_text: str, sentiment: str) -> List[str]:
        """Extract key points that should be addressed in the reply."""
        text_lower = review_text.lower()
        key_points = []
        
        # Common issues to address
        issue_keywords = {
            'Thank customer for feedback': ['review', 'feedback'],
            'Address food quality concerns': ['food', 'taste', 'cold', 'hot'],
            'Acknowledge service issues': ['service', 'staff', 'waiter', 'slow'],
            'Apologize for wait time': ['wait', 'long', 'slow', 'late'],
            'Address cleanliness concerns': ['clean', 'dirty', 'mess'],
            'Acknowledge pricing feedback': ['expensive', 'price', 'cost', 'value']
        }
        
        for point, keywords in issue_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                key_points.append(point)
        
        # Always thank for positive reviews
        if sentiment == 'positive':
            key_points.insert(0, 'Express gratitude for positive feedback')
        
        return key_points[:3]  # Return max 3 key points
    
    def _fallback_reply(self, rating: int, sentiment: str) -> Dict[str, any]: # type: ignore
        """Fallback reply when AI generation fails."""
        return {
            'reply': self._generate_template_reply(rating, sentiment),
            'tone': self._determine_tone(rating, sentiment),
            'key_points': ['Thank customer for feedback', 'Address main concerns']
        }

#Global AI service instance
ai_service = AIService()

# Test function for debugging
def test_ai_reply():
    """Test function to debug AI reply generation."""
    print("Testing AI reply generation...")
    test_review = "The food was amazing and the service was excellent!"
    test_rating = 5
    test_sentiment = "positive"
    
    result = ai_service.suggest_reply(test_review, test_rating, test_sentiment)
    print(f"Result: {result}")
    return result

if __name__ == "__main__":
    test_ai_reply()