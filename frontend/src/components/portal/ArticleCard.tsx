'use client';

import React from 'react';
import { Article } from '@/types/article';

interface ArticleCardProps {
  article: Article;
  onClick?: () => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg cursor-pointer group animate-in fade-in duration-300"
      data-testid={`article-${article.id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {article.category && (
            <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-3">
              {article.category}
            </span>
          )}
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {article.title}
          </h3>
          <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            {article.author && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {article.author}
              </span>
            )}
            <span>•</span>
            <span>{formatDate(article.published_date)}</span>
            {article.organization && (
              <>
                <span>•</span>
                <span>{article.organization}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-3">
        {article.summary}
      </p>

      {article.keywords && article.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {article.keywords.slice(0, 5).map((keyword, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-md"
            >
              {keyword}
            </span>
          ))}
          {article.keywords.length > 5 && (
            <span className="px-2 py-1 text-xs text-zinc-500 dark:text-zinc-500">
              +{article.keywords.length - 5} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
        >
          Read Original
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          Saved {formatDate(article.created_at)}
        </span>
      </div>
    </div>
  );
};
