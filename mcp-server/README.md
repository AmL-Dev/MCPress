# MCPress MCP Server

An MCP (Model Context Protocol) server that provides AI agents with access to journalist-written news articles.

## Features

- **Semantic Search**: Search articles by meaning using vector embeddings
- **Article Retrieval**: Get full article content by ID
- **Filtered Listing**: Browse articles by category, media source, or author

## Prerequisites

- Python 3.10+
- A Supabase project with the articles table and search function configured

## Supabase Setup

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up or sign in
2. Click "New Project" to create a new project
3. Select your organization (or create one if needed)
4. Enter a name for your project (e.g., "mcpress")
5. Set a database password and click "Create new project"
6. Wait for the project to finish setting up (this may take a minute)

### Get Your Supabase URL and Key

1. In your Supabase dashboard, go to **Project Settings** (gear icon in the sidebar)
2. Click on **API** under the Configuration section
3. You'll find:
   - **Project URL**: Looks like `https://abc123xyz456.supabase.co`
   - **anon public key**: Safe for client-side use, respects RLS policies
   - **Service role secret**: Bypasses Row Level Security, for server-side use only

4. Click "Reveal" to show the service role secret key

### Which Key Should You Use?

**For this MCP server, always use the `service_role` key.**

The server needs full database access to perform semantic search operations, which requires bypassing Row Level Security policies. The service role key provides this access but should never be used in client-side code or exposed publicly.

**Key types explained:**
- **anon key**: Safe for client-side applications, enforces RLS policies
- **service_role key**: Full database access, bypasses RLS - server-side only

### Configure Environment Variables

Copy the example environment file and add your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key
```

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
   SUPABASE_SERVICE_KEY=your-supabase-service-role-key
   SUPABASE_ANON_KEY=your-supabase-anon-key
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
        "SUPABASE_SERVICE_KEY": "your-service-role-key"
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
