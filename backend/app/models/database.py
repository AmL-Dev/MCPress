"""SQLAlchemy database models for MCPress."""
from datetime import date, datetime
from typing import List, Optional
import uuid

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship

from app.database.connection import async_engine
from sqlalchemy import Column, DateTime, Text, UniqueConstraint


class Base:
    """Base class for all models."""
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Organization(Base):
    """News organization model."""
    __tablename__ = "organizations"
    __table_args__ = {"schema": "public"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    
    # Relationships
    articles = relationship("Article", back_populates="organization", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<Organization(id={self.id}, name='{self.name}')>"


class Category(Base):
    """Article category model."""
    __tablename__ = "categories"
    __table_args__ = {"schema": "public"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    
    # Relationships
    articles = relationship("Article", back_populates="category", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name='{self.name}')>"


class Article(Base):
    """Main article model."""
    __tablename__ = "articles"
    __table_args__ = {"schema": "public"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    url = Column(String(2048), unique=True, nullable=False)
    title = Column(String(500), nullable=False)
    author = Column(String(255), nullable=True)
    published_date = Column(Date, nullable=True)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    keywords = Column(ARRAY(String(100)), default=[])
    image_url = Column(String(2048), nullable=True)
    
    # Foreign keys
    category_id = Column(UUID(as_uuid=True), ForeignKey("public.categories.id"), nullable=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("public.organizations.id"), nullable=True)
    
    # Relationships
    category = relationship("Category", back_populates="articles")
    organization = relationship("Organization", back_populates="articles")
    embedding = relationship("ArticleEmbedding", back_populates="article", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Article(id={self.id}, title='{self.title[:50]}...')>"


class ArticleEmbedding(Base):
    """Article embedding vector model."""
    __tablename__ = "article_embeddings"
    __table_args__ = {"schema": "public"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id = Column(UUID(as_uuid=True), ForeignKey("public.articles.id", ondelete="CASCADE"), nullable=False, unique=True)
    embedding = Column(ARRAY(Text), nullable=False)  # Stored as array of floats for JSON compatibility
    
    # Relationships
    article = relationship("Article", back_populates="embedding")
    
    def __repr__(self) -> str:
        return f"<ArticleEmbedding(id={self.id}, article_id={self.article_id})>"


# Import Base from the models module to make it available
from app.models.database import Base
