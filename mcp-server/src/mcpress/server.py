"""MCPress MCP Server - Main entry point."""

import os

from fastmcp import FastMCP

from mcpress.tools import register_tools

# Create the MCP server
mcp = FastMCP("MCPress")

# Register all tools
register_tools(mcp)


def main() -> None:
    """Run the MCP server.

    Use stdio transport by default. For chat integration, run with HTTP:
        MCP_TRANSPORT=http uv run python -m mcpress
    Then set MCP_SERVER_URL=http://localhost:8001/mcp in the frontend .env.
    """
    transport = (os.getenv("MCP_TRANSPORT") or "").strip().lower()
    port = int(os.getenv("MCP_PORT", "8001"))  # 8001 to avoid conflict with backend on 8000

    if transport == "http":
        mcp.run(transport="http", host="127.0.0.1", port=port)
    else:
        mcp.run()


if __name__ == "__main__":
    main()
