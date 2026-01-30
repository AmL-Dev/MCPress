export type UserRole = "publisher" | "reader" | null;

export interface OnboardingStep {
    id: string;
    title: string;
    description: string;
}

/**
 * MCP Tool invocation status
 */
export type MCPToolStatus = "loading" | "success" | "error";

/**
 * MCP Tool result data structure
 */
export interface MCPToolResult {
    toolName: string;
    status: MCPToolStatus;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    error?: string;
}

/**
 * Configuration for MCP server connection
 */
export interface MCPConfig {
    serverUrl: string;
    transport: "http" | "sse";
    auth?: {
        type: "bearer" | "oauth";
        token?: string;
    };
}
