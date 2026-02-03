# MCPress Backend

Journalist-written news, natively accessible live to LLMs. A licensed API that gives AI agents access to up-to-date, journalist-written news without scraping.

## Features

- **Article Extraction**: Fetch and parse article content from URLs using Jina.ai
- **AI-Powered Metadata**: Extract title, author, date, summary, keywords, and category using Groq
- **Semantic Search**: Store article embeddings with OpenAI for similarity search
- **MCP Server Ready**: Designed to work with FastMCP for AI agent access

## Tech Stack

- **Python**: FastAPI, Pydantic
- **Vector storage**: ChromaDB (local, no Supabase)
- **AI**: Groq (extraction), OpenAI (embeddings)
- **Scraping**: Jina.ai Reader

## Quick Start

### Prerequisites

- [uv](https://docs.astral.sh/uv/) (Python package and project manager)
- **Python 3.12+** (uv will use the version in `.python-version` or your default)
- API keys for Groq and OpenAI

### Installation

Dependencies are managed with **uv** via `pyproject.toml` (not `requirements.txt`). To add a new dependency later, use `uv add <package>`.

1. From the repo root, go to the backend:
   ```bash
   cd backend
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   uv sync
   ```
   This uses `pyproject.toml` and `uv.lock`. If the project didn’t have a venv yet, run `uv venv` first, then `uv sync`.

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your GROQ_API_KEY and OPENAI_API_KEY
   ```

4. Start the server:
   ```bash
   uv run uvicorn app.main:app --reload
   ```

The API will be available at `http://localhost:8000`  
API docs at `http://localhost:8000/docs`

### Populate articles from URLs

With the server running, you can bulk-import articles from a predefined list of news URLs:

```bash
# From backend directory
uv run python scripts/populate_articles.py
```

Optional env vars: `BACKEND_URL` (default `http://localhost:8000`), `DELAY_SECS` (default `2`, seconds between requests).

## Environment Variables

| Variable | Description | Required |
|---------|-------------|----------|
| `CHROMA_PERSIST_DIR` | Directory for ChromaDB data (default: `./data/chroma`) | No |
| `GROQ_API_KEY` | Groq API key for extraction | Yes |
| `OPENAI_API_KEY` | OpenAI API key for embeddings | Yes |
| `API_HOST` | Server host (default: 0.0.0.0) | No |
| `API_PORT` | Server port (default: 8000) | No |
| `DEBUG` | Enable debug mode (default: false) | No |
| `CORS_ORIGINS` | Comma-separated allowed origins | No |
| `JINA_API_KEY` | Jina.ai reader API key (optional) | No |

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

## Storage (ChromaDB)

Articles and embeddings are stored locally in ChromaDB. The path is set by `CHROMA_PERSIST_DIR` (default `./data/chroma`). No Supabase or PostgreSQL is required.

## Project Structure

```
backend/
  app/
    __init__.py
    main.py              # FastAPI app entry point
    config.py            # Settings and environment variables
    api/
      routes/
        articles.py      # Article API endpoints
    models/
      article.py         # Pydantic schemas
    services/
      extractor.py       # URL scraping + Groq extraction
      embedder.py        # OpenAI embedding generation
      storage.py         # Article persistence
    store/
      chroma_store.py    # ChromaDB add/get/query/list
  scripts/
    populate_articles.py # Bulk-import from URLs
  pyproject.toml         # Project and dependencies (uv)
  uv.lock                # Locked dependency versions
  .python-version        # Python version for uv
  .env.example
```

## Development

### Adding dependencies

Add a new package with uv (updates `pyproject.toml` and `uv.lock`):

```bash
uv add <package>
```

### Running Tests
```bash
uv run pytest
```

### Type Checking
```bash
uv run mypy app/
```

### Code Formatting
```bash
uv run black app/
uv run isort app/
```

## License

MIT
