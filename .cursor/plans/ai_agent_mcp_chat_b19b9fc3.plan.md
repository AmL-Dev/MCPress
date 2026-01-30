---
name: AI Agent MCP Chat
overview: Build an AI agent chat interface in the Next.js frontend that can call MCP server tools using the Vercel AI SDK's `@ai-sdk/mcp` package, with proper tool result rendering on the client side.
todos:
  - id: install-deps
    content: Install @ai-sdk/mcp package with bun
    status: completed
  - id: update-env
    content: Add MCP_SERVER_URL to env config and .env.example
    status: completed
  - id: update-route
    content: Update /api/chat route to use createMCPClient and pass MCP tools to streamText
    status: completed
  - id: update-chat-ui
    content: Update ChatInterface to render tool invocations with loading and result states
    status: completed
  - id: create-tool-components
    content: Create reusable ToolResult component for displaying tool outputs
    status: completed
  - id: add-types
    content: Add TypeScript types for MCP tool integration
    status: completed
isProject: false
---

# AI Agent Chat Interface with MCP Tool Calling

## Architecture Overview

```mermaid
flowchart LR
    subgraph client [Client]
        ChatUI[ChatInterface.tsx]
    end
    subgraph server [Next.js API Route]
        Route["/api/chat"]
        MCPClient[MCP Client]
    end
    subgraph mcp [MCP Server]
        Tools[MCP Tools]
    end
    
    ChatUI -->|"useChat hook"| Route
    Route -->|"createMCPClient"| MCPClient
    MCPClient -->|"tools()"| Tools
    Tools -->|"tool results"| MCPClient
    MCPClient -->|"streamText"| Route
    Route -->|"stream response"| ChatUI
```

## Key Dependencies to Add

```bash
bun add @ai-sdk/mcp
```

The `@ai-sdk/mcp` package provides:

- `createMCPClient` - Creates an MCP client connection
- Transport options: HTTP, SSE, or stdio

## Implementation Steps

### 1. Update API Route ([frontend/src/app/api/chat/route.ts](frontend/src/app/api/chat/route.ts))

Transform the existing route to:

- Initialize MCP client using `createMCPClient` with HTTP or SSE transport
- Fetch available tools from the MCP server via `client.tools()`
- Pass tools to `streamText` for the AI to use
- Handle cleanup with `onFinish` callback to close the client

Key code pattern:

```typescript
import { createMCPClient } from '@ai-sdk/mcp';
import { streamText, convertToModelMessages, UIMessage, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const mcpClient = await createMCPClient({
    transport: {
      type: 'sse', // or 'http'
      url: process.env.MCP_SERVER_URL!,
    },
  });

  const tools = await mcpClient.tools();

  const result = streamText({
    model: openai('gpt-4o'),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5), // Allow multi-step tool calls
    onFinish: async () => await mcpClient.close(),
    onError: async () => await mcpClient.close(),
  });

  return result.toUIMessageStreamResponse();
}
```

### 2. Update Environment Config ([frontend/src/config/env.ts](frontend/src/config/env.ts))

Add MCP server configuration:

- `MCP_SERVER_URL` - URL of the MCP server (HTTP or SSE endpoint)
- Optional: `MCP_SERVER_AUTH` - Authorization header if needed

### 3. Update ChatInterface Component ([frontend/src/components/chat/ChatInterface.tsx](frontend/src/components/chat/ChatInterface.tsx))

Enhance to render tool invocations:

- Check `message.parts` for tool-specific types (e.g., `tool-<toolName>`)
- Display loading state when `part.state === 'input-available'`
- Render tool results when `part.state === 'output-available'`
- Create reusable components for common tool result displays

Key code pattern for rendering tool parts:

```typescript
{message.parts.map((part, index) => {
  switch (part.type) {
    case 'text':
      return <p key={index}>{part.text}</p>;
    case 'tool-searchArticles': // Example MCP tool
      return part.state === 'output-available' 
        ? <ArticleResults key={index} data={part.output} />
        : <LoadingSpinner key={index} label="Searching articles..." />;
    default:
      return null;
  }
})}
```

### 4. Create Tool Result Components

Create UI components in `frontend/src/components/chat/tools/` for rendering specific tool outputs:

- Generic `ToolResult.tsx` for displaying JSON tool outputs
- Specialized components as needed for specific MCP tools

### 5. Add Types ([frontend/src/types/index.ts](frontend/src/types/index.ts))

Add TypeScript types for:

- MCP tool inputs/outputs
- Extended message part types

## Configuration Required

Add to `.env` (or `.env.local`):

```
MCP_SERVER_URL=http://localhost:3001/sse  # Your MCP server endpoint
```

## Notes

- The MCP client connection is created per-request and closed after streaming completes
- `stepCountIs(5)` allows the AI to make up to 5 consecutive tool calls in one turn
- Tool names from MCP servers become `tool-<name>` part types on the client
- For local development, you'll need an MCP server running (can be mocked initially)