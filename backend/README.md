# MCPress Backend

Journalist-written news, natively accessible live to LLMs. A licensed API that gives AI agents access to up-to-date, journalist-written news without scraping.

## Features

- **Article Extraction**: Fetch and parse article content from URLs using Jina.ai
- **AI-Powered Metadata**: Extract title, author, date, summary, keywords, and category using Groq
- **Semantic Search**: Store article embeddings with OpenAI for similarity search
- **MCP Server Ready**: Designed to work with FastMCP for AI agent access

## Tech Stack

- **Python**: FastAPI, SQLAlchemy, Pydantic
- **Database**: Supabase (PostgreSQL) with pgvector
- **AI**: Groq (extraction), OpenAI (embeddings)
- **Scraping**: Jina.ai Reader

## Quick Start

### Prerequisites

- Python 3.11+
- Supabase project with pgvector extension
- API keys for Groq and OpenAI

### Installation

1. Clone the repository:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys and database URL
```

5. Set up the database:
```bash
# Run the migration in your Supabase SQL editor
# See: supabase/migrations/001_create_schema.sql
```

6. Start the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### Populate articles from URLs

With the server running, you can bulk-import articles from a predefined list of news URLs:

```bash
# From backend directory
python scripts/populate_articles.py
```

Optional env vars: `BACKEND_URL` (default `http://localhost:8000`), `DELAY_SECS` (default `2`, seconds between requests).

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `GROQ_API_KEY` | Groq API key for extraction | Yes |
| `OPENAI_API_KEY` | OpenAI API key for embeddings | Yes |
| `API_HOST` | Server host (default: 0.0.0.0) | No |
| `API_PORT` | Server port (default: 8000) | No |
| `DEBUG` | Enable debug mode (default: false) | No |

## API Endpoints

### Extract Article

Extract article content and metadata from a URL.

```http
POST /api/v1/articles/extract
Content-Type: application/json

{
  "url": "https://example.com/article"
}
```

**Response:**
```json
{
  "url": "https://example.com/article",
  "data": {
    "title": "Article Title",
    "author": "Author Name",
    "published_date": "2024-01-30",
    "content": "Full article content...",
    "summary": "2-3 sentence summary...",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "category": "tech"
  }
}
```

### Save Article

Save an article to the database with its embedding.

```http
POST /api/v1/articles/save
Content-Type: application/json

{
  "url": "https://example.com/article",
  "title": "Article Title",
  "author": "Author Name",
  "published_date": "2024-01-30",
  "content": "Full article content...",
  "summary": "2-3 sentence summary...",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "category": "tech",
  "organization": {
    "name": "News Organization",
    "email": "contact@news.org"
  },
  "image_url": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://example.com/article",
  "title": "Article Title",
  "message": "Article saved successfully"
}
```

### Get Article

Retrieve an article by ID.

```http
GET /api/v1/articles/{article_id}
```

## Database Schema

```
organizations
  id: uuid (PK)
  name: text (unique)
  email: text (unique)
  created_at: timestamp
  updated_at: timestamp

categories
  id: uuid (PK)
  name: text (unique)
  created_at: timestamp
  updated_at: timestamp

articles
  id: uuid (PK)
  url: text (unique)
  title: text
  author: text (nullable)
  published_date: date (nullable)
  content: text
  summary: text
  keywords: text[]
  category_id: uuid (FK)
  organization_id: uuid (FK)
  image_url: text (nullable)
  created_at: timestamp
  updated_at: timestamp

article_embeddings
  id: uuid (PK)
  article_id: uuid (FK, unique)
  embedding: vector(1536)
  created_at: timestamp
```

## Project Structure

```
backend/
  app/
    __init__.py
    main.py              # FastAPI app entry point
    config.py            # Settings and environment variables
    api/
      __init__.py
      routes/
        __init__.py
        articles.py      # Article API endpoints
    database/
      __init__.py
      connection.py      # Supabase/PostgreSQL connection
    models/
      __init__.py
      article.py         # Pydantic schemas
      database.py        # SQLAlchemy models
    services/
      __init__.py
      extractor.py       # URL scraping + Groq extraction
      embedder.py        # OpenAI embedding generation
      storage.py         # Database operations
  requirements.txt
  .env.example
supabase/
  migrations/
    001_create_schema.sql
```

## Development

### Running Tests
```bash
pytest
```

### Type Checking
```bash
mypy app/
```

### Code Formatting
```bash
black app/
isort app/
```

## License

MIT
