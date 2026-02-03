"""Storage service using Chroma for article persistence and search."""
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from app.models.article import SaveRequest, OrganizationInfo
from app.services.embedder import get_embedder, EmbeddingError
from app.store.chroma_store import (
    add,
    get as store_get,
    get_by_url as store_get_by_url,
    query as store_query,
    list_articles as store_list_articles,
)


class StorageError(Exception):
    """Custom exception for storage errors."""
    pass


def _parse_date(date_string: Optional[str]) -> Optional[str]:
    """Return ISO date string or None."""
    if not date_string:
        return None
    date_string = date_string.strip()
    if not date_string:
        return None
    # Already ISO or pass through
    return date_string


def _article_from_store(row: dict) -> dict:
    """Map Chroma store row to API article shape."""
    meta = row.get("metadata") or {}
    content = row.get("document") or ""
    return {
        "id": row.get("id"),
        "url": meta.get("url", ""),
        "title": meta.get("title", ""),
        "author": meta.get("author") or None,
        "published_date": meta.get("published_date") or None,
        "content": content,
        "summary": meta.get("summary", ""),
        "keywords": [k.strip() for k in (meta.get("keywords") or "").split(",") if k.strip()],
        "category": meta.get("category") or None,
        "organization": meta.get("organization") or None,
        "image_url": meta.get("image_url") or None,
        "created_at": meta.get("created_at", ""),
        "updated_at": meta.get("updated_at", ""),
    }


class ArticleStorage:
    """Service for storing and retrieving articles via Chroma."""

    def __init__(self):
        self.embedder = get_embedder()

    async def save_article(self, request: SaveRequest) -> UUID:
        """Save or update an article in Chroma. Returns article id (UUID)."""
        now = datetime.utcnow().isoformat() + "Z"
        existing = store_get_by_url(request.url)
        if existing:
            article_id = existing["id"]
        else:
            article_id = str(uuid4())

        metadata = {
            "url": request.url,
            "title": request.title,
            "author": request.author or "",
            "published_date": _parse_date(request.published_date) or "",
            "category": (request.category or "").strip().lower(),
            "organization": (request.organization.name if request.organization else "") or "",
            "summary": request.summary,
            "keywords": ",".join(request.keywords) if request.keywords else "",
            "image_url": request.image_url or "",
            "created_at": existing["metadata"].get("created_at", now) if existing else now,
            "updated_at": now,
        }

        try:
            embedding = self.embedder.generate(request.summary)
        except EmbeddingError:
            # Use zero vector if embedding fails so document is still stored
            embedding = [0.0] * 1536

        add(
            id=article_id,
            embedding=embedding,
            document=request.content,
            metadata=metadata,
        )
        return UUID(article_id)

    async def get_article(self, article_id: UUID) -> Optional[dict]:
        """Get one article by id. Returns dict compatible with get_article route or None."""
        row = store_get(str(article_id))
        if not row:
            return None
        return _article_from_store(row)

    async def get_article_by_url(self, url: str) -> Optional[dict]:
        """Get one article by url. Returns dict or None."""
        row = store_get_by_url(url)
        if not row:
            return None
        return _article_from_store(row)

    async def search_articles(
        self,
        query_text: str,
        n_results: int = 10,
        where: Optional[dict] = None,
        similarity_threshold: Optional[float] = None,
    ) -> list[dict]:
        """Semantic search. Returns list of article dicts with similarity."""
        try:
            embedding = self.embedder.generate(query_text)
        except EmbeddingError:
            return []
        rows = store_query(query_embedding=embedding, n_results=n_results, where=where)
        out = []
        for row in rows:
            sim = row.get("similarity")
            if similarity_threshold is not None and sim is not None and sim < similarity_threshold:
                continue
            article = _article_from_store({"id": row["id"], "document": row.get("document", ""), "metadata": row.get("metadata", {})})
            article["similarity"] = sim
            article["media_source"] = article.get("organization")
            out.append(article)
        return out

    async def list_articles(
        self,
        category: Optional[str] = None,
        source: Optional[str] = None,
        author: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict]:
        """List articles with optional filters."""
        conditions = []
        if category:
            conditions.append({"category": category.strip().lower()})
        if source:
            conditions.append({"organization": source.strip()})
        if author:
            conditions.append({"author": author.strip()})
        where = {"$and": conditions} if len(conditions) > 1 else (conditions[0] if conditions else None)
        rows = store_list_articles(where=where, limit=limit, offset=offset)
        return [_article_from_store(r) for r in rows]


_storage: Optional[ArticleStorage] = None


def get_storage() -> ArticleStorage:
    """Get the singleton storage instance."""
    global _storage
    if _storage is None:
        _storage = ArticleStorage()
    return _storage
