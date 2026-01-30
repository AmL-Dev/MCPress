'use client';

import React from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import Link from 'next/link';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 group">
                <svg className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  MCPress <span className="text-blue-600">Chat</span>
                </h1>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full flex flex-col items-center justify-center">
        <ChatInterface />
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-zinc-500 dark:text-zinc-600 text-sm">
        © 2026 MCPress. All rights reserved.
      </footer>
    </div>
  );
}
