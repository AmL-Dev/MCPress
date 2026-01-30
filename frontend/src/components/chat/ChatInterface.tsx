"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { ToolResult } from "./ToolResult";

/**
 * ChatInterface component for AI-powered conversations.
 * Provides a chat UI with streaming responses from OpenAI with MCP tool support.
 */
export default function ChatInterface() {
    const [input, setInput] = useState("");
    const { messages, append, error, status, reload, stop } = useChat({
        api: "/api/chat",
    });

    if (error) {
        return (
            <div className="flex items-center justify-center p-4 text-red-500 bg-red-50 rounded-lg">
                <p>Error: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                    AI Assistant
                </h2>
                <p className="text-sm text-gray-500">
                    Powered by OpenAI GPT-4o with MCP Tools
                </p>
            </div>

            {/* Messages Container */}
            <div className="flex-1 p-4 max-h-[60vh] overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-gray-400">
                        <p>
                            Start a conversation by typing a message below. You
                            can also use MCP tools to search articles and more.
                        </p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${
                                message.role === "user"
                                    ? "justify-end"
                                    : "justify-start"
                            }`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                    message.role === "user"
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                            >
                                <p className="text-sm font-medium mb-1 capitalize">
                                    {message.role === "user"
                                        ? "You"
                                        : "Assistant"}
                                </p>
                                {message.parts.map((part, index) => {
                                    switch (part.type) {
                                        case "text":
                                            return (
                                                <p
                                                    key={index}
                                                    className="whitespace-pre-wrap"
                                                >
                                                    {part.text}
                                                </p>
                                            );
                                        default:
                                            // Handle MCP tool invocations
                                            // Tool parts have type like "tool-searchArticles"
                                            if (
                                                part.type.startsWith("tool-")
                                            ) {
                                                const toolName =
                                                    part.type.replace(
                                                        "tool-",
                                                        "",
                                                    );
                                                const isLoading =
                                                    part.state ===
                                                    "input-available";
                                                const hasOutput =
                                                    part.state ===
                                                    "output-available";

                                                return (
                                                    <ToolResult
                                                        key={index}
                                                        toolName={toolName}
                                                        status={
                                                            isLoading
                                                                ? "loading"
                                                                : hasOutput
                                                                  ? "success"
                                                                  : "error"
                                                        }
                                                        input={part.input}
                                                        output={
                                                            hasOutput
                                                                ? part.output
                                                                : undefined
                                                        }
                                                    />
                                                );
                                            }
                                            return null;
                                    }
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Actions Bar */}
            {messages.length > 0 && (
                <div className="flex gap-2 px-4 py-2 bg-gray-50 border-t border-gray-200">
                    {status === "streaming" ? (
                        <button
                            onClick={stop}
                            className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 transition-colors"
                        >
                            Stop
                        </button>
                    ) : (
                        <button
                            onClick={reload}
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                        >
                            Regenerate
                        </button>
                    )}
                </div>
            )}

            {/* Input Form */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (input.trim()) {
                        append({ role: "user", content: input.trim() });
                        setInput("");
                    }
                }}
                className="p-4 bg-gray-50 border-t border-gray-200"
            >
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.currentTarget.value)}
                        placeholder="Ask me anything or request a tool..."
                        disabled={status === "streaming"}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={status === "streaming" || !input.trim()}
                        className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {status === "streaming" ? (
                            <span className="flex items-center gap-2">
                                <svg
                                    className="animate-spin h-4 w-4"
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
                                Sending...
                            </span>
                        ) : (
                            "Send"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
