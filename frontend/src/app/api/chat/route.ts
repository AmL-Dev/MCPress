import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage } from "ai";
import { createMCPClient } from "@ai-sdk/mcp";
import { env } from "@/config/env";

/**
 * Maximum duration for the chat API endpoint in seconds.
 * Set to 30 seconds for reasonable response times.
 */
export const maxDuration = 30;

/**
 * Handles POST requests for chat interactions.
 * Connects to MCP server, fetches available tools, and streams responses
 * from OpenAI GPT model with MCP tool calling capabilities.
 */
export async function POST(request: Request): Promise<Response> {
    const { messages }: { messages: UIMessage[] } = await request.json();

    // Check if MCP server URL is configured
    if (!env.mcpServerUrl) {
        // Fallback to basic chat without MCP tools
        const result = streamText({
            model: openai(env.openaiModel),
            messages,
        });

        return result.toDataStreamResponse();
    }

    let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;

    try {
        // Create MCP client and fetch available tools
        mcpClient = await createMCPClient({
            transport: {
                type: env.mcpServerTransport as "http" | "sse",
                url: env.mcpServerUrl,
            },
        });

        const tools = await mcpClient.tools();

        const result = streamText({
            model: openai(env.openaiModel),
            messages,
            tools,
            onFinish: async () => {
                if (mcpClient) {
                    await mcpClient.close();
                    mcpClient = null;
                }
            },
        });

        return result.toDataStreamResponse();
    } catch (error) {
        // Close client on error
        if (mcpClient) {
            await mcpClient.close();
        }

        console.error("Chat API error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
