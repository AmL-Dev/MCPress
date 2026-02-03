"""Article API routes for extraction and storage."""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.models.article import (
    ExtractRequest,
    ExtractResponse,
    ArticleContent,
    SaveRequest,
    SaveResponse,
    ErrorResponse,
)
from app.services.extractor import get_extractor, ExtractionError
from app.services.storage import get_storage, StorageError


router = APIRouter(prefix="/articles", tags=["articles"])


@router.post(
    "/extract",
    response_model=ExtractResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
        500: {"model": ErrorResponse, "description": "Extraction failed"},
    },
    summary="Extract Article Content",
    description="Extract article content, metadata, summary, and keywords from a URL.",
)
async def extract_article(request: ExtractRequest) -> ExtractResponse:
    """
    Extract article content and metadata from a URL.
    
    This endpoint:
    1. Fetches the article URL using Jina.ai reader
    2. Uses Groq LLM to extract title, author, date, content, summary, keywords, and category
    3. Returns all extracted data for review before saving
    
    Args:
        request: ExtractRequest with the article URL
        
    Returns:
        ExtractResponse with extracted article data
        
    Raises:
        HTTPException: If extraction fails
    """
    extractor = get_extractor()
    
    try:
        article_content = await extractor.extract(request.url)
        
        return ExtractResponse(
            url=request.url,
            data=article_content,
        )
        
    except ExtractionError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post(
    "/save",
    response_model=SaveResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
        500: {"model": ErrorResponse, "description": "Save failed"},
    },
    summary="Save Article",
    description="Save an article to the database with its embedding.",
)
async def save_article(request: SaveRequest) -> SaveResponse:
    """
    Save an article to the database.
    
    This endpoint:
    1. Generates an embedding of the article summary using OpenAI
    2. Inserts or updates the organization (by email)
    3. Inserts or updates the category (by name)
    4. Inserts or updates the article record
    5. Inserts the embedding record linked to the article
    
    Args:
        request: SaveRequest with all article data (may include frontend edits)
        
    Returns:
        SaveResponse with saved article ID and status
        
    Raises:
        HTTPException: If save fails
    """
    storage = get_storage()
    
    try:
        article_id = await storage.save_article(request)
        
        return SaveResponse(
            id=article_id,
            url=request.url,
            title=request.title,
            message="Article saved successfully",
        )
        
    except StorageError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get(
    "/search",
    summary="Search Articles",
    description="Semantic search with optional filters (category, source, since).",
)
async def search_articles(
    q: str = Query(..., description="Search query text"),
    limit: int = Query(10, ge=1, le=50),
    category: Optional[str] = Query(None),
    source: Optional[str] = Query(None, description="Organization / media source name"),
    since: Optional[str] = Query(None, description="ISO date, e.g. 2024-01-01"),
    similarity_threshold: float = Query(0.5, ge=0, le=1),
):
    """Search articles by semantic similarity with optional metadata filters."""
    storage = get_storage()
    where = None
    conditions = []
    if category:
        conditions.append({"category": category.strip().lower()})
    if source:
        conditions.append({"organization": source.strip()})
    if since:
        conditions.append({"published_date": {"$gte": since}})
    if conditions:
        where = {"$and": conditions} if len(conditions) > 1 else conditions[0]
    try:
        articles = await storage.search_articles(
            query_text=q,
            n_results=limit,
            where=where,
            similarity_threshold=similarity_threshold,
        )
        return articles
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get(
    "",
    summary="List Articles",
    description="List articles with optional filters (category, source, author) and pagination.",
)
async def list_articles(
    category: Optional[str] = Query(None),
    source: Optional[str] = Query(None, description="Organization / media source"),
    author: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List articles with optional filters and pagination."""
    storage = get_storage()
    try:
        articles = await storage.list_articles(
            category=category,
            source=source,
            author=author,
            limit=limit,
            offset=offset,
        )
        return articles
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get(
    "/{article_id}",
    responses={
        404: {"model": ErrorResponse, "description": "Article not found"},
        500: {"model": ErrorResponse, "description": "Database error"},
    },
    summary="Get Article",
    description="Get an article by ID.",
)
async def get_article(article_id: UUID):
    """
    Get an article by ID.
    
    Args:
        article_id: Article UUID
        
    Returns:
        Article data
        
    Raises:
        HTTPException: If article not found
    """
    storage = get_storage()
    
    try:
        article = await storage.get_article(article_id)
        
        if not article:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Article with ID {article_id} not found",
            )
        return article
        
    except StorageError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
