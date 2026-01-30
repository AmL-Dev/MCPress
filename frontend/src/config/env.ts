/**
 * Centralized environment variable configuration.
 * All environment variables should be accessed through this config object.
 */

export const env = {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    llmModel: process.env.NEXT_PUBLIC_LLM_MODEL || "gpt-4o",
    isProduction: process.env.NODE_ENV === "production",
    isDevelopment: process.env.NODE_ENV === "development",
    // OpenAI configuration
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    openaiModel: process.env.OPENAI_MODEL || "gpt-4o",
    // MCP Server configuration
    mcpServerUrl: process.env.MCP_SERVER_URL || "",
    mcpServerTransport: process.env.MCP_SERVER_TRANSPORT || "sse",
    // Backend API configuration
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    // Mock mode for testing without backend
    useMock: process.env.NEXT_PUBLIC_USE_MOCK === "true",
};

// Simple validation to ensure required environment variables are set
if (env.isProduction && !process.env.NEXT_PUBLIC_APP_URL) {
    console.warn("Warning: NEXT_PUBLIC_APP_URL is not set in production.");
}

if (env.isProduction && !env.openaiApiKey) {
    console.warn("Warning: OPENAI_API_KEY is not set in production.");
}
