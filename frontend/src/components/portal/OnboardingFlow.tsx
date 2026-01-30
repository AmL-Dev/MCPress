'use client';

import React, { useState } from 'react';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/Button';

interface OnboardingStep {
  title: string;
  description: string;
  fields: { name: string; label: string; type: string; placeholder: string; icon?: string }[];
}

const ONBOARDING_CONTENT: Record<NonNullable<UserRole>, OnboardingStep[]> = {
  publisher: [
    {
      title: "Import your first article",
      description: "Paste a URL from your blog or news site to see how it looks on MCPress.",
      fields: [
        { 
          name: "articleUrl", 
          label: "Article URL", 
          type: "url", 
          placeholder: "https://your-site.com/awesome-article",
          icon: "🔗"
        }
      ]
    },
    {
      title: "Identify your presence",
      description: "Are you an individual journalist or a media organization?",
      fields: [
        { name: "entityName", label: "Name / Organization Name", type: "text", placeholder: "e.g. John Doe or The Daily Press" },
        { name: "bio", label: "Short Bio / Mission", type: "text", placeholder: "What do you write about?" }
      ]
    },
    {
      title: "Your Expertise",
      description: "What topics will you be publishing?",
      fields: [
        { name: "topics", label: "Primary Topics", type: "text", placeholder: "Tech, Politics, Science..." }
      ]
    }
  ],
  reader: [
    {
      title: "Personalize your feed",
      description: "What are you interested in?",
      fields: [
        { name: "interests", label: "Interests", type: "text", placeholder: "AI, Cooking, Travel..." }
      ]
    }
  ]
};

interface OnboardingFlowProps {
  role: UserRole;
  onComplete: () => void;
  onBack: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ role, onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const steps = role ? ONBOARDING_CONTENT[role] : [];

  const handleNext = async () => {
    if (role === 'publisher' && currentStep === 0) {
      // Simulate "Importing" feel
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsLoading(false);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  if (!role || !steps || steps.length === 0) return null;

  const step = steps[currentStep];

  return (
    <div className="w-full max-w-xl bg-white dark:bg-zinc-900 p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in fade-in zoom-in duration-500 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />
      
      <button 
        onClick={onBack}
        className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8 flex items-center gap-2 transition-colors group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to roles
      </button>
      
      <div className="mb-10">
        <div className="flex gap-2 mb-6">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i < currentStep ? 'bg-green-500' : i === currentStep ? 'bg-blue-600 w-4' : 'bg-zinc-100 dark:bg-zinc-800'
              }`}
            />
          ))}
        </div>
        <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">
          {step.title}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
          {step.description}
        </p>
      </div>

      <div className="space-y-6">
        {step.fields.map((field) => (
          <div key={field.name} className="group">
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
              {field.label}
            </label>
            <div className="relative">
              {field.icon && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">
                  {field.icon}
                </span>
              )}
              <input
                type={field.type}
                placeholder={field.placeholder}
                className={`w-full ${field.icon ? 'pl-12' : 'px-5'} py-4 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all dark:text-white text-lg placeholder:text-zinc-400`}
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={handleNext}
        disabled={isLoading}
        className="w-full mt-10 py-4 text-lg shadow-lg shadow-blue-500/20"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'
        )}
      </Button>

      {role === 'publisher' && currentStep === 0 && (
        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-500">
          Tip: You can skip this step and add articles manually later.
        </p>
      )}
    </div>
  );
};
