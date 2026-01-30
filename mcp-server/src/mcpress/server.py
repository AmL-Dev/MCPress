"""MCPress MCP Server - Main entry point."""

import logging
from fastmcp import FastMCP

from mcpress.tools import register_tools

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("mcpress")

# Create the MCP server
mcp = FastMCP("MCPress")

# Register all tools
register_tools(mcp)


def main() -> None:
    """Run the MCP server."""
    mcp.run(transport="sse")


if __name__ == "__main__":
    main()
