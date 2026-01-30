"""Pydantic schemas for article operations."""
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl


class ExtractRequest(BaseModel):
    """Request schema for extracting article content from URL."""
    url: str = Field(..., description="URL of the article to extract")


class ArticleContent(BaseModel):
    """Extracted article content from LLM processing."""
    title: str = Field(..., description="Article title")
    author: Optional[str] = Field(None, description="Article author name")
    published_date: Optional[str] = Field(None, description="Publication date (ISO format)")
    content: str = Field(..., description="Full article content in markdown")
    summary: str = Field(..., description="AI-generated summary of the article")
    keywords: List[str] = Field(..., description="Extracted keywords")
    category: str = Field(..., description="Assigned category")


class ExtractResponse(BaseModel):
    """Response schema for article extraction."""
    url: str = Field(..., description="Original article URL")
    data: ArticleContent = Field(..., description="Extracted article data")


class OrganizationInfo(BaseModel):
    """Organization information for saving articles."""
    name: str = Field(..., description="Organization name")
    email: str = Field(..., description="Organization email")


class SaveRequest(BaseModel):
    """Request schema for saving an article to the database."""
    url: str = Field(..., description="Original article URL")
    title: str = Field(..., description="Article title")
    author: Optional[str] = Field(None, description="Article author")
    published_date: Optional[str] = Field(None, description="Publication date (ISO format)")
    content: str = Field(..., description="Full article content")
    summary: str = Field(..., description="Article summary")
    keywords: List[str] = Field(..., description="Article keywords")
    category: str = Field(..., description="Article category")
    organization: Optional[OrganizationInfo] = Field(None, description="Organization info")
    image_url: Optional[str] = Field(None, description="Featured image URL")


class SaveResponse(BaseModel):
    """Response schema for saved articles."""
    id: UUID = Field(..., description="Saved article ID")
    url: str = Field(..., description="Saved article URL")
    title: str = Field(..., description="Saved article title")
    message: str = Field(default="Article saved successfully", description="Status message")


class ArticleResponse(BaseModel):
    """Full article response from database."""
    id: UUID
    url: str
    title: str
    author: Optional[str]
    published_date: Optional[date]
    content: str
    summary: str
    keywords: List[str]
    category: Optional[str]
    organization: Optional[str]
    image_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ErrorResponse(BaseModel):
    """Error response schema."""
    error: str = Field(..., description="Error type")
    detail: str = Field(..., description="Error details")
    status_code: int = Field(..., description="HTTP status code")
