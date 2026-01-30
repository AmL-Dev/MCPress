"""Storage service for database operations."""
from datetime import date, datetime
from typing import Optional, Tuple
from uuid import UUID, uuid4

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.config import settings
from app.database.connection import get_async_session_context
from app.database.connection import async_engine
from app.models.database import Article, ArticleEmbedding, Category, Organization
from app.models.article import SaveRequest, OrganizationInfo
from app.services.embedder import get_embedder, EmbeddingError


class StorageError(Exception):
    """Custom exception for storage errors."""
    pass


class ArticleStorage:
    """Service for storing articles and embeddings in the database."""
    
    def __init__(self):
        self.embedder = get_embedder()
    
    async def _get_or_create_organization(
        self,
        session: AsyncSession,
        org_info: Optional[OrganizationInfo],
    ) -> Optional[UUID]:
        """
        Get or create an organization by email.
        
        Args:
            session: Database session
            org_info: Organization information
            
        Returns:
            Organization ID or None if no organization provided
        """
        if not org_info:
            return None
        
        try:
            # Try to find existing organization
            result = await session.execute(
                select(Organization).where(Organization.email == org_info.email)
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                return existing.id
            
            # Create new organization
            org = Organization(
                id=uuid4(),
                name=org_info.name,
                email=org_info.email,
            )
            session.add(org)
            await session.flush()
            
            return org.id
            
        except Exception as e:
            raise StorageError(f"Failed to create organization: {str(e)}")
    
    async def _get_or_create_category(
        self,
        session: AsyncSession,
        category_name: str,
    ) -> Optional[UUID]:
        """
        Get or create a category by name.
        
        Args:
            session: Database session
            category_name: Category name
            
        Returns:
            Category ID
        """
        try:
            # Normalize category name
            category_name = category_name.lower().strip()
            
            # Try to find existing category
            result = await session.execute(
                select(Category).where(Category.name == category_name)
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                return existing.id
            
            # Create new category
            category = Category(
                id=uuid4(),
                name=category_name,
            )
            session.add(category)
            await session.flush()
            
            return category.id
            
        except Exception as e:
            raise StorageError(f"Failed to create category: {str(e)}")
    
    async def _parse_date(self, date_string: Optional[str]) -> Optional[date]:
        """
        Parse date string to date object.
        
        Args:
            date_string: Date in ISO format or None
            
        Returns:
            Date object or None
        """
        if not date_string:
            return None
        
        try:
            # Try ISO format first
            return date.fromisoformat(date_string)
        except ValueError:
            # Try other common formats
            formats = [
                "%Y-%m-%d",
                "%d/%m/%Y",
                "%m/%d/%Y",
                "%Y/%m/%d",
            ]
            
            for fmt in formats:
                try:
                    return datetime.strptime(date_string, fmt).date()
                except ValueError:
                    continue
            
            return None
    
    async def save_article(self, request: SaveRequest) -> UUID:
        """
        Save an article to the database with its embedding.
        
        Args:
            request: Article save request with all article data
            
        Returns:
            Saved article ID
            
        Raises:
            StorageError: If save fails
        """
        try:
            async with get_async_session_context() as session:
                async with session.begin():
                    # Get or create organization
                    organization_id = await self._get_or_create_organization(
                        session,
                        request.organization,
                    )
                    
                    # Get or create category
                    category_id = await self._get_or_create_category(
                        session,
                        request.category,
                    )
                    
                    # Parse date
                    published_date = await self._parse_date(request.published_date)
                    
                    # Check if article already exists
                    result = await session.execute(
                        select(Article).where(Article.url == request.url)
                    )
                    existing = result.scalar_one_or_none()
                    
                    if existing:
                        # Update existing article
                        existing.title = request.title
                        existing.author = request.author
                        existing.published_date = published_date
                        existing.content = request.content
                        existing.summary = request.summary
                        existing.keywords = request.keywords
                        existing.category_id = category_id
                        existing.organization_id = organization_id
                        existing.image_url = request.image_url
                        
                        article_id = existing.id
                    else:
                        # Create new article
                        article = Article(
                            id=uuid4(),
                            url=request.url,
                            title=request.title,
                            author=request.author,
                            published_date=published_date,
                            content=request.content,
                            summary=request.summary,
                            keywords=request.keywords,
                            category_id=category_id,
                            organization_id=organization_id,
                            image_url=request.image_url,
                        )
                        session.add(article)
                        await session.flush()
                        article_id = article.id
                    
                    # Generate embedding
                    try:
                        embedding_vector = self.embedder.generate(request.summary)
                        
                        # Check if embedding already exists
                        emb_result = await session.execute(
                            select(ArticleEmbedding).where(
                                ArticleEmbedding.article_id == article_id
                            )
                        )
                        existing_embedding = emb_result.scalar_one_or_none()
                        
                        if existing_embedding:
                            # Update existing embedding
                            existing_embedding.embedding = embedding_vector
                        else:
                            # Create new embedding
                            embedding = ArticleEmbedding(
                                id=uuid4(),
                                article_id=article_id,
                                embedding=embedding_vector,
                            )
                            session.add(embedding)
                            
                    except EmbeddingError as e:
                        # Log warning but don't fail article save
                        # Article can still be saved without embedding
                        pass
                    
                    return article_id
                    
        except StorageError:
            raise
        except IntegrityError as e:
            raise StorageError(f"Database integrity error: {str(e)}")
        except Exception as e:
            raise StorageError(f"Failed to save article: {str(e)}")
    
    async def get_article(self, article_id: UUID) -> Optional[Article]:
        """
        Get an article by ID.
        
        Args:
            article_id: Article UUID
            
        Returns:
            Article or None if not found
        """
        try:
            async with get_async_session_context() as session:
                result = await session.execute(
                    select(Article).where(Article.id == article_id)
                )
                return result.scalar_one_or_none()
        except Exception as e:
            raise StorageError(f"Failed to get article: {str(e)}")
    
    async def get_article_by_url(self, url: str) -> Optional[Article]:
        """
        Get an article by URL.
        
        Args:
            url: Article URL
            
        Returns:
            Article or None if not found
        """
        try:
            async with get_async_session_context() as session:
                result = await session.execute(
                    select(Article).where(Article.url == url)
                )
                return result.scalar_one_or_none()
        except Exception as e:
            raise StorageError(f"Failed to get article by URL: {str(e)}")


# Singleton instance
_storage: Optional[ArticleStorage] = None


def get_storage() -> ArticleStorage:
    """Get the singleton storage instance."""
    global _storage
    if _storage is None:
        _storage = ArticleStorage()
    return _storage
