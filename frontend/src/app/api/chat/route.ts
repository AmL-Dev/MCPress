import { groq } from "@ai-sdk/groq";
import { convertToModelMessages, stepCountIs, streamText, ToolSet, UIMessage } from "ai";
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
 * from Groq model with MCP tool calling capabilities.
 */
export async function POST(request: Request): Promise<Response> {
    const { messages }: { messages: UIMessage[] } = await request.json();
    const modelMessages = await convertToModelMessages(messages);

    // Check if MCP server URL is configured
    if (!env.mcpServerUrl) {
        // Fallback to basic chat without MCP tools
        const result = streamText({
            model: groq(env.groqModel),
            messages: modelMessages,
        });

        return result.toTextStreamResponse();
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
            model: groq(env.groqModel),
            system:
                "You have access to tools to search and read articles. When the user asks about articles, news, or content, use the search_articles, list_articles, or get_article tools to fetch real data. Always prefer these tools over answering from memory. When a tool returns one or more articles, use that information to answer: summarize the articles and cite them. Do not say there are no results if the tool returned a non-empty list. When citing an article, use only a markdown link in this exact form: [article title](url). Do not use 【】 brackets or show the URL in parentheses separately. Do not display raw article IDs (UUIDs).",
            messages: modelMessages,
            tools: tools as ToolSet,
            stopWhen: stepCountIs(5),
            onFinish: async () => {
                if (mcpClient) {
                    await mcpClient.close();
                    mcpClient = null;
                }
            },
        });

        return result.toTextStreamResponse();
    } catch (error) {
        // Close client on error
        if (mcpClient) {
            try {
                await mcpClient.close();
            } catch {
                // ignore close errors
            }
        }

        const cause = error instanceof Error ? error.cause : undefined;
        const code =
            cause && typeof cause === "object" && "code" in cause
                ? (cause as { code: string }).code
                : undefined;
        const isConnectionRefused = code === "ECONNREFUSED";

        if (isConnectionRefused) {
            console.warn("MCP server unreachable, falling back to basic chat:", env.mcpServerUrl);
            const result = streamText({
                model: groq(env.groqModel),
                messages: modelMessages,
            });
            return result.toTextStreamResponse();
        }

        console.error("Chat API error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
