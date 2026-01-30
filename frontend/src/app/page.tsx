'use client';

import React, { useState } from 'react';
import { RoleCard } from '@/components/portal/RoleCard';
import { OnboardingFlow } from '@/components/portal/OnboardingFlow';
import { UserRole } from '@/types';
import ChatInterface from '@/components/chat/ChatInterface';

export default function PortalPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setIsOnboarding(true);
  };

  const handleComplete = () => {
    alert('Onboarding complete! Welcome to MCPress.');
    // Reset for demo purposes
    setIsOnboarding(false);
    setSelectedRole(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col items-center justify-center p-6">
      {!isOnboarding && !showChat ? (
        <>
          <div className="max-w-4xl w-full text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white mb-4 tracking-tight">
              Welcome to <span className="text-blue-600">MCPress</span>
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Choose your path to get started. Are you here to publish groundbreaking stories or to stay informed?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
            <RoleCard
              role="publisher"
              title="Content Publisher"
              description="Independent journalist or media organization looking to publish, build an audience, and monetize."
              icon="✍️"
              onSelect={handleRoleSelect}
              testID="role-publisher"
            />
            <RoleCard
              role="reader"
              title="Reader"
              description="Stay updated with the latest news, follow your favorite writers, and join the conversation."
              icon="📖"
              onSelect={handleRoleSelect}
              testID="role-reader"
            />
            <div
              onClick={() => setShowChat(true)}
              className="cursor-pointer p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg group"
              data-testid="role-ai-chat"
            >
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                AI Chat
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Chat with our AI assistant powered by OpenAI GPT-4o for instant answers and assistance.
              </p>
            </div>
          </div>
        </>
      ) : showChat ? (
        <div className="w-full max-w-4xl">
          <button
            onClick={() => setShowChat(false)}
            className="mb-4 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </button>
          <ChatInterface />
        </div>
      ) : (
        <OnboardingFlow 
          role={selectedRole} 
          onComplete={handleComplete} 
          onBack={() => {
            setIsOnboarding(false);
            setSelectedRole(null);
          }} 
        />
      )}

      <footer className="mt-20 text-zinc-500 dark:text-zinc-600 text-sm">
        © 2026 MCPress. All rights reserved.
      </footer>
    </div>
  );
}
