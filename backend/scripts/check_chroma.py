#!/usr/bin/env python3
"""
One-off script to inspect Chroma: stored articles, embeddings, and a manual similarity search.

Run from backend dir: uv run python scripts/check_chroma.py
"""

import asyncio
import sys
from pathlib import Path

# Ensure backend app is on path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.store.chroma_store import _get_collection, query as chroma_query
from app.services.embedder import get_embedder


def main() -> None:
    col = _get_collection()
    count = col.count()
    print(f"=== Chroma collection 'articles' ===\nCount: {count}\n")

    if count == 0:
        print("No documents in collection. Add an article via the portal first.")
        return

    # Get all ids, one sample with full data including embedding
    result = col.get(include=["documents", "metadatas", "embeddings"], limit=10)
    ids = result["ids"] or []
    docs = result["documents"] or []
    metas = result["metadatas"] or []
    embs_raw = result.get("embeddings")
    embs = list(embs_raw) if embs_raw is not None else []

    print("--- Stored articles (up to 10) ---")
    for i, id in enumerate(ids):
        meta = metas[i] if i < len(metas) else {}
        doc = docs[i] if i < len(docs) else ""
        emb = embs[i] if i < len(embs) else []
        print(f"  id: {id}")
        print(f"  title: {meta.get('title', '(none)')}")
        print(f"  url: {meta.get('url', '(none)')}")
        print(f"  summary (first 120 chars): {(meta.get('summary') or '')[:120]}...")
        print(f"  document length: {len(doc)} chars")
        print(f"  embedding length: {len(emb)} dims")
        print()

    # Manual similarity search
    query_text = "Australian Open 2026 winner"
    print(f"--- Manual similarity search: {query_text!r} ---")
    embedder = get_embedder()
    try:
        query_emb = embedder.generate(query_text)
    except Exception as e:
        print(f"Embedding failed: {e}")
        return
    print(f"Query embedding: {len(query_emb)} dims\n")

    rows = chroma_query(query_embedding=query_emb, n_results=5)
    if not rows:
        print("No results from Chroma query.")
        return
    for r in rows:
        meta = r.get("metadata") or {}
        dist = r.get("distance")
        sim = r.get("similarity")
        print(f"  id: {r.get('id')}")
        print(f"  title: {meta.get('title', '(none)')}")
        print(f"  distance: {dist}")
        print(f"  similarity (1 - distance): {sim}")
        print()


if __name__ == "__main__":
    main()
