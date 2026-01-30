"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { ToolResult } from "./ToolResult";

/**
 * ChatInterface component for AI-powered conversations.
 * Provides a modern, clean chat UI with streaming responses from OpenAI with MCP tool support.
 */
function ChatInterface() {
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const { messages, sendMessage, error, status, reload, stop } = useChat({
        api: "/api/chat",
    });

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="flex flex-col w-full max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[80vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                        AI Assistant
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            GPT-4o + MCP Tools
                        </p>
                    </div>
                </div>
                {(status === "submitted" || status === "streaming") && (
                    <button
                        onClick={stop}
                        className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                        title="Stop generating"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9v-4z" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Messages Container */}
            <div 
                ref={scrollRef}
                className="flex-1 p-6 overflow-y-auto space-y-6 scroll-smooth"
            >
                {error && (
                    <div className="p-4 mb-4 text-sm text-red-800 rounded-2xl bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-800 flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <span className="font-bold">Error:</span> {error.message}
                            <button 
                                onClick={() => reload()} 
                                className="ml-3 underline hover:no-underline font-bold"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <div className="max-w-xs">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">How can I help?</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Ask me to search articles, summarize content, or help with your research.
                            </p>
                        </div>
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
                                className={`max-w-[85%] rounded-2xl px-5 py-3.5 ${
                                    message.role === "user"
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider opacity-70`}>
                                        {message.role === "user" ? "You" : "Assistant"}
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {message.parts.map((part, index) => {
                                        switch (part.type) {
                                            case "text":
                                                return (
                                                    <p
                                                        key={index}
                                                        className="text-sm leading-relaxed whitespace-pre-wrap"
                                                    >
                                                        {part.text}
                                                    </p>
                                                );
                                            default:
                                                if (part.type.startsWith("tool-")) {
                                                    const toolName = part.type.replace("tool-", "");
                                                    const isLoading = part.state === "input-available";
                                                    const hasOutput = part.state === "output-available";

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
                        </div>
                    ))
                )}
                {(status === "submitted" || status === "streaming") && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-5 py-3.5 flex items-center gap-2">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce"></span>
                            <span className="flex h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]"></span>
                            <span className="flex h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Form */}
            <div className="p-6 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (input.trim() && status === "ready") {
                            sendMessage({ text: input.trim() });
                            setInput("");
                        }
                    }}
                    className="relative flex items-center"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.currentTarget.value)}
                        placeholder="Type a message..."
                        disabled={status !== "ready"}
                        className="w-full pl-5 pr-14 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                    />
                    <button
                        type="submit"
                        disabled={status !== "ready" || !input.trim()}
                        className="absolute right-2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-700 disabled:text-zinc-400 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                    >
                        {status !== "ready" ? (
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChatInterface;
