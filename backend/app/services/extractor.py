"""Article extraction service using Jina.ai and Groq API."""
import json
import re
from typing import Optional

import httpx
from groq import Groq
from groq import GroqError

from app.config import settings
from app.models.article import ArticleContent


class ExtractionError(Exception):
    """Custom exception for extraction errors."""
    pass


class ArticleExtractor:
    """Service for extracting article content and metadata."""
    
    def __init__(self):
        self.groq_client = Groq(api_key=settings.groq_api_key)
        self.jina_reader_url = settings.jina_reader_url
    
    async def fetch_url_content(self, url: str) -> str:
        """
        Fetch article content using Jina.ai reader.
        
        Args:
            url: The article URL to fetch
            
        Returns:
            Markdown content of the article
            
        Raises:
            ExtractionError: If the URL cannot be fetched
        """
        try:
            # Jina.ai reader URL format
            jina_url = f"{self.jina_reader_url}{url}"
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(jina_url)
                response.raise_for_status()
                
                content = response.text
                
                # Check if we got a valid response
                if not content or len(content) < 100:
                    raise ExtractionError(f"Content too short or empty from URL: {url}")
                
                return content
                
        except httpx.HTTPStatusError as e:
            raise ExtractionError(f"HTTP error fetching URL: {e.response.status_code} - {e.response.text}")
        except httpx.RequestError as e:
            raise ExtractionError(f"Request error fetching URL: {str(e)}")
        except Exception as e:
            raise ExtractionError(f"Unexpected error fetching URL: {str(e)}")
    
    def _build_extraction_prompt(self, content: str) -> str:
        """
        Build the system prompt for structured extraction.
        
        Args:
            content: The article markdown content
            
        Returns:
            Complete prompt for the LLM
        """
        categories = ", ".join(settings.allowed_categories)
        
        prompt = f"""You are an expert article analyzer. Extract the following information from the provided article markdown.

## Article Content
{content[:15000]}  # Limit content to avoid token limits

## Task
Extract the following fields in JSON format:

1. **title**: The main title of the article
2. **author**: The author name(s), if available (null if not found)
3. **published_date**: The publication date in ISO format (YYYY-MM-DD), if available (null if not found)
4. **content**: The main article content (clean markdown without headers/footers/navigation)
5. **summary**: A concise 2-3 sentence summary of the article's main points
6. **keywords**: A list of 5-10 relevant keywords/tags for the article
7. **category**: Assign ONE category from this list: {categories}

## Rules
- Return ONLY valid JSON, no markdown formatting
- If information is not available, use null
- Clean the content to remove navigation, ads, headers, footers
- The summary should capture the essence of the article
- Keywords should be relevant and useful for searching
- Category must be exactly one from the allowed list

## Output Format
{{
  "title": "...",
  "author": "...",
  "published_date": "...",
  "content": "...",
  "summary": "...",
  "keywords": [...],
  "category": "..."
}}"""
        
        return prompt
    
    def _parse_extracted_content(self, raw_content: str) -> ArticleContent:
        """
        Parse the LLM response into an ArticleContent object.
        
        Args:
            raw_content: Raw text response from LLM
            
        Returns:
            Parsed ArticleContent object
            
        Raises:
            ExtractionError: If parsing fails
        """
        try:
            # Clean the response - remove markdown code block markers
            cleaned = raw_content.strip()
            
            # Remove markdown code block syntax
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            elif cleaned.startswith("```"):
                cleaned = cleaned[3:]
            
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            
            cleaned = cleaned.strip()
            
            # Parse JSON
            data = json.loads(cleaned)
            
            # Validate required fields
            required_fields = ["title", "content", "summary", "keywords", "category"]
            for field in required_fields:
                if field not in data:
                    raise ExtractionError(f"Missing required field: {field}")
                if field in ["content", "summary"] and not data[field]:
                    raise ExtractionError(f"Empty required field: {field}")
            
            # Validate category
            if data["category"] not in settings.allowed_categories:
                # Try to find a similar category
                data["category"] = "news"  # Default fallback
            
            # Ensure keywords is a list
            if isinstance(data["keywords"], str):
                # Try to parse as JSON array string
                try:
                    data["keywords"] = json.loads(data["keywords"])
                except json.JSONDecodeError:
                    # Split by comma
                    data["keywords"] = [k.strip() for k in data["keywords"].split(",") if k.strip()]
            
            # Ensure keywords are strings
            data["keywords"] = [str(k) for k in data["keywords"]]
            
            return ArticleContent(
                title=data["title"],
                author=data.get("author"),
                published_date=data.get("published_date"),
                content=data["content"],
                summary=data["summary"],
                keywords=data["keywords"],
                category=data["category"],
            )
            
        except json.JSONDecodeError as e:
            raise ExtractionError(f"Failed to parse JSON response: {str(e)}")
        except KeyError as e:
            raise ExtractionError(f"Missing field in response: {str(e)}")
        except Exception as e:
            raise ExtractionError(f"Failed to parse extracted content: {str(e)}")
    
    async def extract(self, url: str) -> ArticleContent:
        """
        Extract article content and metadata from a URL.
        
        Args:
            url: The article URL to extract
            
        Returns:
            ArticleContent with extracted data
            
        Raises:
            ExtractionError: If extraction fails
        """
        try:
            # Step 1: Fetch content from URL
            content = await self.fetch_url_content(url)
            
            # Step 2: Build extraction prompt
            prompt = self._build_extraction_prompt(content)
            
            # Step 3: Send to Groq for extraction
            response = self.groq_client.chat.completions.create(
                model=settings.groq_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a precise JSON extraction assistant. Always output valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,  # Lower temperature for more consistent output
                max_tokens=4096,
            )
            
            # Step 4: Parse the response
            raw_content = response.choices[0].message.content
            article_content = self._parse_extracted_content(raw_content)
            
            return article_content
            
        except GroqError as e:
            raise ExtractionError(f"Groq API error: {str(e)}")
        except ExtractionError:
            raise
        except Exception as e:
            raise ExtractionError(f"Unexpected extraction error: {str(e)}")


# Singleton instance
_extractor: Optional[ArticleExtractor] = None


def get_extractor() -> ArticleExtractor:
    """Get the singleton extractor instance."""
    global _extractor
    if _extractor is None:
        _extractor = ArticleExtractor()
    return _extractor
