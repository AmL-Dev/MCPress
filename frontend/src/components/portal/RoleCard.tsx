'use client';

import React from 'react';
import { UserRole } from '@/types';

interface RoleCardProps {
  role: UserRole;
  title: string;
  description: string;
  icon: string;
  onSelect: (role: UserRole) => void;
  testID?: string;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  title,
  description,
  icon,
  onSelect,
  testID,
}) => {
  return (
    <button
      onClick={() => onSelect(role)}
      data-testid={testID}
      className="flex flex-col items-center p-6 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl transition-all hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-xl group w-full max-w-sm text-left"
    >
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        {title}
      </h3>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
        {description}
      </p>
      <div className="mt-6 w-full py-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-center font-semibold text-zinc-900 dark:text-zinc-100 group-hover:bg-blue-500 group-hover:text-white transition-colors">
        Select {title}
      </div>
    </button>
  );
};
