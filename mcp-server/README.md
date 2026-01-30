# MCPress MCP Server

An MCP (Model Context Protocol) server that provides AI agents with access to journalist-written news articles.

## Features

- **Semantic Search**: Search articles by meaning using vector embeddings
- **Article Retrieval**: Get full article content by ID
- **Filtered Listing**: Browse articles by category, media source, or author

## Prerequisites

- Python 3.10+
- A Supabase project with the articles table and search function configured

## Installation

1. Navigate to the mcp-server directory:

   ```bash
   cd mcp-server
   ```

2. Create a virtual environment and install dependencies:

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -e .
   ```

3. Copy the environment template and configure your credentials:

   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your Supabase credentials:

   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-service-role-key
   ```

## Running the Server

### Standard (stdio) Transport

```bash
python -m mcpress.server
```

### HTTP Transport

```bash
python -c "from mcpress.server import mcp; mcp.run(transport='http', port=8000)"
```

## Available Tools

### search_articles

Search news articles by semantic similarity.

**Parameters:**
- `query` (str): The search query text
- `limit` (int, optional): Maximum results to return (default: 10)

### get_article

Get a specific article by its ID.

**Parameters:**
- `article_id` (str): The unique identifier of the article

### list_articles

List articles with optional filters.

**Parameters:**
- `category` (str, optional): Filter by category (e.g., "politics", "technology")
- `media_source` (str, optional): Filter by media organization
- `author` (str, optional): Filter by author name
- `limit` (int, optional): Maximum results (default: 20)
- `offset` (int, optional): Pagination offset (default: 0)

## Connecting to the Server

### Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mcpress": {
      "command": "python",
      "args": ["-m", "mcpress.server"],
      "cwd": "/path/to/MCPress/mcp-server",
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_KEY": "your-key"
      }
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings. Use the venv Python path to ensure dependencies are available:

```json
{
  "mcpServers": {
    "mcpress": {
      "command": "/path/to/MCPress/mcp-server/.venv/bin/python",
      "args": ["-m", "mcpress.server"],
      "cwd": "/path/to/MCPress/mcp-server"
    }
  }
}
```

Or install the package globally in your Cursor Python:

```bash
/path/to/python -m pip install -e /path/to/MCPress/mcp-server
```

## Development

Install development dependencies:

```bash
pip install -e ".[dev]"
```

Run linting:

```bash
ruff check src/
ruff format src/
```
