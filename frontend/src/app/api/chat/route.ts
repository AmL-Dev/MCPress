import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
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
    console.log("Received messages:", JSON.stringify(messages, null, 2));

    // Convert UIMessages to ModelMessages (async in AI SDK v6)
    const modelMessages = await convertToModelMessages(messages);

    // Check if MCP server URL is configured
    if (!env.mcpServerUrl) {
        // Fallback to basic chat without MCP tools
        const result = streamText({
            model: openai(env.openaiModel),
            messages: modelMessages,
        });

        return result.toUIMessageStreamResponse();
    }

    let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;

    try {
        console.log("Connecting to MCP server:", env.mcpServerUrl, "with transport:", env.mcpServerTransport);
        // Create MCP client and fetch available tools
        mcpClient = await createMCPClient({
            transport: {
                type: env.mcpServerTransport as "http" | "sse",
                url: env.mcpServerUrl,
            },
        });

        console.log("MCP Client created, fetching tools...");
        const tools = await mcpClient.tools();
        console.log("MCP Tools fetched successfully:", Object.keys(tools));
        console.log("Using OpenAI model:", env.openaiModel);
        console.log("OpenAI API Key present:", !!env.openaiApiKey);

        const result = streamText({
            model: openai(env.openaiModel),
            system: `You are a helpful AI assistant for MCPress, a news article platform. 
You have access to tools to search, list, and retrieve articles from the database.

When users ask about articles, news, or content:
- Use the "search_articles" tool to find articles matching a query
- Use the "list_articles" tool to browse articles by category, author, or source
- Use the "get_article" tool to retrieve full article details by ID

Always use the available tools to answer questions about articles. Don't make up information - use the tools to get real data.`,
            messages: modelMessages,
            tools,
            stopWhen: stepCountIs(5), // Stop after max 5 steps for tool calls
            onStepFinish: ({ text, toolCalls, toolResults, finishReason }) => {
                console.log("Step finished:", {
                    finishReason,
                    text: text?.slice(0, 100),
                    toolCalls: toolCalls?.map(tc => ({ 
                        name: tc.toolName, 
                        input: tc.dynamic ? tc.input : JSON.stringify(tc.input).slice(0, 100),
                        dynamic: tc.dynamic 
                    })),
                    toolResults: toolResults?.map(tr => ({ 
                        toolCallId: tr.toolCallId, 
                        output: JSON.stringify(tr.output).slice(0, 200) 
                    })),
                });
            },
            onFinish: async ({ finishReason, usage }) => {
                console.log("Stream finished:", {
                    finishReason,
                    usage,
                });
                if (mcpClient) {
                    console.log("Closing MCP client...");
                    await mcpClient.close();
                    mcpClient = null;
                }
            },
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        // Close client on error
        if (mcpClient) {
            await mcpClient.close();
        }

        console.error("Chat API error details:", {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            error
        });
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Internal Server Error",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
