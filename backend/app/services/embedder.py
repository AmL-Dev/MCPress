"""Embedding service using OpenAI API."""
from typing import List

from openai import OpenAI, OpenAIError

from app.config import settings


class EmbeddingError(Exception):
    """Custom exception for embedding errors."""
    pass


class Embedder:
    """Service for generating text embeddings using OpenAI."""
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_embedding_model
        self.dimensions = settings.openai_embedding_dimensions
    
    def generate(self, text: str) -> List[float]:
        """
        Generate embedding for the given text.
        
        Args:
            text: Text to generate embedding for
            
        Returns:
            List of embedding dimensions
            
        Raises:
            EmbeddingError: If embedding generation fails
        """
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=text,
                dimensions=self.dimensions,
            )
            
            embedding = response.data[0].embedding
            return embedding
            
        except OpenAIError as e:
            raise EmbeddingError(f"OpenAI API error: {str(e)}")
        except Exception as e:
            raise EmbeddingError(f"Unexpected embedding error: {str(e)}")
    
    async def generate_async(self, text: str) -> List[float]:
        """
        Generate embedding asynchronously (wrapper for sync client).
        
        Args:
            text: Text to generate embedding for
            
        Returns:
            List of embedding dimensions
        """
        # OpenAI Python client doesn't have native async support for embeddings
        # So we use the sync method in an async context
        return self.generate(text)
    
    def generate_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts.
        
        Args:
            texts: List of texts to generate embeddings for
            
        Returns:
            List of embedding vectors
            
        Raises:
            EmbeddingError: If any embedding generation fails
        """
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=texts,
                dimensions=self.dimensions,
            )
            
            embeddings = [data.embedding for data in response.data]
            return embeddings
            
        except OpenAIError as e:
            raise EmbeddingError(f"OpenAI API error: {str(e)}")
        except Exception as e:
            raise EmbeddingError(f"Unexpected embedding error: {str(e)}")


# Singleton instance
_embedder: Embedder | None = None


def get_embedder() -> Embedder:
    """Get the singleton embedder instance."""
    global _embedder
    if _embedder is None:
        _embedder = Embedder()
    return _embedder
