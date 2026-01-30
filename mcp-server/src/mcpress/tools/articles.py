"""Article tools for MCPress MCP server."""

import logging
from typing import Any, List

from fastmcp import FastMCP
from openai import OpenAI, OpenAIError
from supabase import create_client

from mcpress.config import get_settings

logger = logging.getLogger(__name__)


class EmbeddingError(Exception):
    """Custom exception for embedding errors."""

    pass


class Embedder:
    """Service for generating text embeddings using OpenAI."""

    def __init__(self):
        settings = get_settings()
        if not settings.openai_api_key:
            raise EmbeddingError("OPENAI_API_KEY environment variable is required")
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
        logger.debug(f"Generating embedding with model={self.model}, dimensions={self.dimensions}")
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=text,
                dimensions=self.dimensions,
                timeout=30.0,  # 30 second timeout
            )

            embedding = response.data[0].embedding
            logger.debug(f"Embedding generated successfully, length={len(embedding)}")
            return embedding

        except OpenAIError as e:
            error_msg = str(e).lower()
            if "timeout" in error_msg or "timed out" in error_msg:
                logger.error(f"OpenAI API timeout: {str(e)}")
                raise EmbeddingError(f"OpenAI API timeout: {str(e)}")
            logger.error(f"OpenAI API error: {str(e)}")
            raise EmbeddingError(f"OpenAI API error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected embedding error: {str(e)}")
            raise EmbeddingError(f"Unexpected embedding error: {str(e)}")


def get_supabase_client():
    """Get a Supabase client instance."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_key)


def register_tools(mcp: FastMCP) -> None:
    """Register all article tools with the MCP server."""

    @mcp.tool
    def search_articles(query: str, limit: int = 10, similarity_threshold: float = 0.5) -> list[dict[str, Any]]:
        """
        Search news articles by semantic similarity.

        Uses embedding-based vector search to find articles matching the query.

        Args:
            query: The search query text
            limit: Maximum number of articles to return (default: 10)
            similarity_threshold: Minimum similarity score (0.0 to 1.0, default: 0.5)

        Returns:
            List of matching articles with title, summary, author, and metadata
        """
        logger.info(f"search_articles called with query='{query}', limit={limit}, threshold={similarity_threshold}")

        try:
            # Generate embedding for the query
            embedder = Embedder()
            logger.debug("Generating embedding for query")
            query_embedding = embedder.generate(query)
            logger.info(f"Embedding generated successfully, dimension count: {len(query_embedding)}")

            client = get_supabase_client()

            # Call the pgvector similarity search function
            logger.debug("Calling match_article_embeddings RPC")
            result = (
                client.rpc(
                    "match_article_embeddings",
                    {
                        "query_embedding": query_embedding,
                        "match_threshold": similarity_threshold,
                        "match_count": limit,
                    },
                )
                .execute()
            )

            logger.info(f"RPC call completed, data: {result.data}")

            if not result.data:
                logger.info("No matching articles found")
                return []

            # Format the results
            articles = []
            for row in result.data:
                article = {
                    "id": row["article_id"],
                    "title": row["title"],
                    "author": row["author"],
                    "published_date": row["published_date"],
                    "summary": row["summary"],
                    "url": row["url"],
                    "keywords": row["keywords"],
                    "category": row["category_name"],
                    "media_source": row["media_source"],
                    "similarity": row["similarity"],
                }
                articles.append(article)

            logger.info(f"Returning {len(articles)} articles")
            return articles

        except EmbeddingError as e:
            logger.error(f"Embedding error: {str(e)}")
            return [{"error": f"Embedding error: {str(e)}"}]
        except Exception as e:
            error_type = type(e).__name__
            error_msg = str(e).lower()
            if "timeout" in error_msg or "timed out" in error_msg or error_type in ("TimeoutError", "CancelledError"):
                logger.error(f"Request timed out: {str(e)}")
                return [{"error": f"Request timed out. Please try again or reduce the scope of your search."}]
            logger.error(f"Search failed: {str(e)}")
            return [{"error": f"Search failed: {str(e)}"}]

    @mcp.tool
    def get_article(article_id: str) -> dict[str, Any] | None:
        """
        Get a specific article by its ID.

        Args:
            article_id: The unique identifier of the article

        Returns:
            The article data including full content, or None if not found
        """
        client = get_supabase_client()

        result = (
            client.table("articles")
            .select(
                "id, url, title, author, published_date, content, summary, keywords, "
                "category_id, organization_id, image_url, created_at, updated_at, "
                "categories(name), organizations(name)"
            )
            .eq("id", article_id)
            .single()
            .execute()
        )

        if not result.data:
            return None

        article = result.data

        # Flatten the nested category and organization objects
        flattened = {
            "id": article["id"],
            "url": article["url"],
            "title": article["title"],
            "author": article["author"],
            "published_date": article["published_date"],
            "content": article["content"],
            "summary": article["summary"],
            "keywords": article["keywords"],
            "category_id": article["category_id"],
            "organization_id": article["organization_id"],
            "image_url": article["image_url"],
            "created_at": article["created_at"],
            "updated_at": article["updated_at"],
        }
        # Include category and organization names if available
        if article.get("categories") and article["categories"].get("name"):
            flattened["category"] = article["categories"]["name"]
        if article.get("organizations") and article["organizations"].get("name"):
            flattened["media_source"] = article["organizations"]["name"]

        return flattened

    @mcp.tool
    def list_articles(
        category: str | None = None,
        media_source: str | None = None,
        author: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """
        List articles with optional filters.

        Args:
            category: Filter by article category (e.g., "politics", "technology")
            media_source: Filter by media organization name
            author: Filter by author name
            limit: Maximum number of articles to return (default: 20)
            offset: Number of articles to skip for pagination (default: 0)

        Returns:
            List of articles matching the filters, ordered by publish date (newest first)
        """
        client = get_supabase_client()

        # Build the query with proper column names from the schema
        query = client.table("articles").select(
            "id, url, title, author, published_date, content, summary, keywords, "
            "category_id, organization_id, image_url, created_at, updated_at, "
            "categories(name), organizations(name)"
        )

        # First resolve category name to category_id if filtering by category
        category_id = None
        if category:
            cat_result = (
                client.table("categories")
                .select("id")
                .eq("name", category)
                .single()
                .execute()
            )
            if cat_result.data:
                category_id = cat_result.data["id"]
            else:
                # No matching category found, return empty list
                return []

        # First resolve organization name to organization_id if filtering by media_source
        organization_id = None
        if media_source:
            org_result = (
                client.table("organizations")
                .select("id")
                .eq("name", media_source)
                .single()
                .execute()
            )
            if org_result.data:
                organization_id = org_result.data["id"]
            else:
                # No matching organization found, return empty list
                return []

        # Apply filters
        if category_id:
            query = query.eq("category_id", category_id)
        if organization_id:
            query = query.eq("organization_id", organization_id)
        if author:
            query = query.eq("author", author)

        result = (
            query.order("published_date", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        if not result.data:
            return []

        # Flatten the nested category and organization objects
        articles = []
        for article in result.data:
            flattened = {
                "id": article["id"],
                "url": article["url"],
                "title": article["title"],
                "author": article["author"],
                "published_date": article["published_date"],
                "content": article["content"],
                "summary": article["summary"],
                "keywords": article["keywords"],
                "category_id": article["category_id"],
                "organization_id": article["organization_id"],
                "image_url": article["image_url"],
                "created_at": article["created_at"],
                "updated_at": article["updated_at"],
            }
            # Include category and organization names if available
            if article.get("categories") and article["categories"].get("name"):
                flattened["category"] = article["categories"]["name"]
            if article.get("organizations") and article["organizations"].get("name"):
                flattened["media_source"] = article["organizations"]["name"]
            articles.append(flattened)

        return articles
