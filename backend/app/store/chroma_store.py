"""Chroma-based article store: add, get, query, update, delete, get_by_url, list."""
from datetime import datetime
from pathlib import Path
from typing import Any, Optional
from uuid import uuid4

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import settings

COLLECTION_NAME = "articles"


def _ensure_chroma_dir() -> None:
    path = Path(settings.chroma_persist_dir) if not isinstance(settings.chroma_persist_dir, Path) else settings.chroma_persist_dir
    path.mkdir(parents=True, exist_ok=True)


def _get_client():
    _ensure_chroma_dir()
    return chromadb.PersistentClient(
        path=str(settings.chroma_persist_dir),
        settings=ChromaSettings(anonymized_telemetry=False),
    )


def _get_collection():
    client = _get_client()
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"description": "MCPress articles with embeddings"},
    )


def _metadata_to_str(value: Any) -> str:
    """Chroma metadata must be str, int, float, or bool."""
    if value is None:
        return ""
    if isinstance(value, list):
        return ",".join(str(x) for x in value)
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def add(
    id: str,
    embedding: list[float],
    document: str,
    metadata: dict[str, Any],
) -> None:
    """Add or upsert one article. Metadata values must be serializable for Chroma."""
    col = _get_collection()
    meta = {k: _metadata_to_str(v) for k, v in metadata.items()}
    col.upsert(
        ids=[id],
        embeddings=[embedding],
        documents=[document],
        metadatas=[meta],
    )


def get(id: str) -> Optional[dict[str, Any]]:
    """Get one article by id. Returns dict with id, document, metadata, or None."""
    col = _get_collection()
    result = col.get(ids=[id], include=["documents", "metadatas"])
    if not result["ids"]:
        return None
    return {
        "id": result["ids"][0],
        "document": result["documents"][0] if result["documents"] else "",
        "metadata": result["metadatas"][0] if result["metadatas"] else {},
    }


def get_by_url(url: str) -> Optional[dict[str, Any]]:
    """Get one article by url (query by metadata). Returns first match or None."""
    col = _get_collection()
    result = col.get(
        where={"url": url},
        include=["documents", "metadatas"],
        limit=1,
    )
    if not result["ids"]:
        return None
    return {
        "id": result["ids"][0],
        "document": result["documents"][0] if result["documents"] else "",
        "metadata": result["metadatas"][0] if result["metadatas"] else {},
    }


def update(id: str, embedding: Optional[list[float]] = None, document: Optional[str] = None, metadata: Optional[dict[str, Any]] = None) -> None:
    """Update existing document by id. Pass only fields to update."""
    existing = get(id)
    if not existing:
        return
    # Chroma update: we need to pass full doc/embedding for update; get existing and merge
    col = _get_collection()
    # Chroma doesn't have partial update; we need to get current then upsert with merged data
    current = col.get(ids=[id], include=["embeddings", "documents", "metadatas"])
    emb = embedding if embedding is not None else (current["embeddings"][0] if current["embeddings"] else None)
    doc = document if document is not None else (current["documents"][0] if current["documents"] else "")
    meta = dict(current["metadatas"][0]) if current["metadatas"] else {}
    if metadata:
        for k, v in metadata.items():
            meta[k] = _metadata_to_str(v)
    if emb is None:
        # Can't upsert without embedding; skip update if only metadata changed and we don't have emb
        col.update(ids=[id], documents=[doc], metadatas=[meta])
    else:
        col.upsert(ids=[id], embeddings=[emb], documents=[doc], metadatas=[meta])


def delete(id: str) -> None:
    """Delete one article by id."""
    col = _get_collection()
    col.delete(ids=[id])


def query(
    query_embedding: list[float],
    n_results: int = 10,
    where: Optional[dict[str, Any]] = None,
) -> list[dict[str, Any]]:
    """Semantic search. Returns list of dicts with id, document, metadata, distance."""
    col = _get_collection()
    kwargs = {
        "query_embeddings": [query_embedding],
        "n_results": n_results,
        "include": ["documents", "metadatas", "distances"],
    }
    if where is not None:
        kwargs["where"] = where
    result = col.query(**kwargs)
    out = []
    if not result["ids"] or not result["ids"][0]:
        return out
    for i, id in enumerate(result["ids"][0]):
        dist = result["distances"][0][i] if result.get("distances") and result["distances"][0] else None
        similarity = 1 - (dist or 0) if dist is not None else None  # Chroma uses L2; for cosine, 1 - distance
        out.append({
            "id": id,
            "document": result["documents"][0][i] if result["documents"] and result["documents"][0] else "",
            "metadata": result["metadatas"][0][i] if result["metadatas"] and result["metadatas"][0] else {},
            "distance": dist,
            "similarity": similarity,
        })
    return out


def list_articles(
    where: Optional[dict[str, Any]] = None,
    limit: int = 20,
    offset: int = 0,
) -> list[dict[str, Any]]:
    """List articles with optional metadata filter. Uses get(where=..., limit=offset+limit) then slice."""
    col = _get_collection()
    kwargs = {"include": ["documents", "metadatas"], "limit": offset + limit}
    if where is not None:
        kwargs["where"] = where
    result = col.get(**kwargs)
    if not result["ids"]:
        return []
    ids = result["ids"][offset:offset + limit]
    docs = (result["documents"] or [])[offset:offset + limit]
    metas = (result["metadatas"] or [])[offset:offset + limit]
    return [
        {
            "id": id,
            "document": docs[i] if i < len(docs) else "",
            "metadata": metas[i] if i < len(metas) else {},
        }
        for i, id in enumerate(ids)
    ]
