import React from "react";

interface ToolResultProps {
    toolName: string;
    status: "loading" | "success" | "error";
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    error?: string;
}

/**
 * ToolResult component for displaying MCP tool invocation status and results.
 * Shows loading state during tool execution and formatted output when complete.
 */
export function ToolResult({
    toolName,
    status,
    input,
    output,
    error,
}: ToolResultProps) {
    const isLoading = status === "loading";
    const isError = status === "error";

    return (
        <div
            className={`mt-3 p-3 rounded-lg border ${
                isLoading
                    ? "bg-blue-50 border-blue-200"
                    : isError
                      ? "bg-red-50 border-red-200"
                      : "bg-green-50 border-green-200"
            }`}
        >
            <div className="flex items-center gap-2 mb-2">
                {isLoading ? (
                    <svg
                        className="animate-spin h-4 w-4 text-blue-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                ) : isError ? (
                    <svg
                        className="h-4 w-4 text-red-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                ) : (
                    <svg
                        className="h-4 w-4 text-green-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                )}
                <span
                    className={`text-sm font-medium capitalize ${
                        isLoading
                            ? "text-blue-700"
                            : isError
                              ? "text-red-700"
                              : "text-green-700"
                    }`}
                >
                    {isLoading
                        ? `Calling ${toolName}...`
                        : isError
                          ? `${toolName} failed`
                          : `${toolName} result`}
                </span>
            </div>

            {input && Object.keys(input).length > 0 && (
                <div className="mb-2">
                    <span className="text-xs font-medium text-gray-600 uppercase">
                        Input
                    </span>
                    <pre className="mt-1 p-2 bg-white/50 rounded text-xs overflow-x-auto">
                        {JSON.stringify(input, null, 2)}
                    </pre>
                </div>
            )}

            {isError && error && (
                <div className="mb-2">
                    <span className="text-xs font-medium text-red-600 uppercase">
                        Error
                    </span>
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                </div>
            )}

            {output && Object.keys(output).length > 0 && (
                <div>
                    <span className="text-xs font-medium text-gray-600 uppercase">
                        Output
                    </span>
                    <pre className="mt-1 p-2 bg-white/50 rounded text-xs overflow-x-auto">
                        {JSON.stringify(output, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
