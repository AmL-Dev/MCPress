"""Article tools for MCPress MCP server. All data is fetched from the backend API."""

import logging
from typing import Any

import httpx
from fastmcp import FastMCP

from mcpress.config import get_settings

logger = logging.getLogger(__name__)


def register_tools(mcp: FastMCP) -> None:
    """Register all article tools with the MCP server."""

    @mcp.tool
    def search_articles(
        query: str,
        limit: int = 10,
        similarity_threshold: float = 0.0,
        category: str | None = None,
        source: str | None = None,
        since: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Search news articles by semantic similarity.

        Uses the backend's embedding-based vector search to find articles matching the query.

        Args:
            query: The search query text
            limit: Maximum number of articles to return (default: 10)
            similarity_threshold: Minimum similarity score (0.0 to 1.0, default: 0.0 to return all top matches)
            category: Filter by category (e.g., tech, politics)
            source: Filter by media organization name
            since: Filter by published date (ISO date, e.g. 2024-01-01)

        Returns:
            List of matching articles with title, summary, author, and metadata
        """
        logger.info(
            "search_articles called with query=%r, limit=%s, threshold=%s",
            query,
            limit,
            similarity_threshold,
        )
        settings = get_settings()
        url = f"{settings.backend_url}/api/v1/articles/search"
        params = {
            "q": query,
            "limit": limit,
            "similarity_threshold": similarity_threshold,
        }
        if category:
            params["category"] = category
        if source:
            params["source"] = source
        if since:
            params["since"] = since
        try:
            with httpx.Client(timeout=60.0) as client:
                r = client.get(url, params=params)
                r.raise_for_status()
                data = r.json()
        except httpx.HTTPStatusError as e:
            logger.error("Search API error: %s %s", e.response.status_code, e.response.text)
            return [{"error": f"Search failed: {e.response.text}"}]
        except Exception as e:
            logger.error("Search failed: %s", e)
            return [{"error": f"Search failed: {str(e)}"}]
        if not isinstance(data, list):
            return [{"error": "Invalid search response"}]
        # Ensure media_source for compatibility
        for a in data:
            if "media_source" not in a and "organization" in a:
                a["media_source"] = a["organization"]
        return data

    @mcp.tool
    def get_article(article_id: str) -> dict[str, Any] | None:
        """
        Get a specific article by its ID.

        Args:
            article_id: The unique identifier of the article

        Returns:
            The article data including full content, or None if not found
        """
        settings = get_settings()
        url = f"{settings.backend_url}/api/v1/articles/{article_id}"
        try:
            with httpx.Client(timeout=30.0) as client:
                r = client.get(url)
                if r.status_code == 404:
                    return None
                r.raise_for_status()
                data = r.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            logger.error("Get article API error: %s %s", e.response.status_code, e.response.text)
            return None
        except Exception as e:
            logger.error("Get article failed: %s", e)
            return None
        if "media_source" not in data and "organization" in data:
            data["media_source"] = data["organization"]
        return data

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
            category: Filter by article category (e.g., politics, technology)
            media_source: Filter by media organization name
            author: Filter by author name
            limit: Maximum number of articles to return (default: 20)
            offset: Number of articles to skip for pagination (default: 0)

        Returns:
            List of articles matching the filters
        """
        settings = get_settings()
        url = f"{settings.backend_url}/api/v1/articles"
        params = {"limit": limit, "offset": offset}
        if category:
            params["category"] = category
        if media_source:
            params["source"] = media_source
        if author:
            params["author"] = author
        try:
            with httpx.Client(timeout=30.0) as client:
                r = client.get(url, params=params)
                r.raise_for_status()
                data = r.json()
        except httpx.HTTPStatusError as e:
            logger.error("List articles API error: %s %s", e.response.status_code, e.response.text)
            return []
        except Exception as e:
            logger.error("List articles failed: %s", e)
            return []
        if not isinstance(data, list):
            return []
        for a in data:
            if "media_source" not in a and "organization" in a:
                a["media_source"] = a["organization"]
        return data
