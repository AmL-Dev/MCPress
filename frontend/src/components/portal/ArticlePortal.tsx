'use client';

import React, { useState, useEffect } from 'react';
import { AddArticleForm } from '@/components/portal/AddArticleForm';
import { ArticleCard } from '@/components/portal/ArticleCard';
import { Article } from '@/types/article';
import { ExtractionResult, SaveArticleData } from '@/types/article';
import { Button } from '@/components/ui/Button';
import { articleAPI } from '@/services/api/articles';
import { env } from '@/config/env';

type ViewMode = 'articles' | 'add';

export const ArticlePortal: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load mock articles on mount if in mock mode
  useEffect(() => {
    if (env.useMock) {
      articleAPI.getArticles().then(mockArticles => {
        setArticles(mockArticles);
      });
    }
  }, []);

  const handleArticleExtracted = (result: ExtractionResult) => {
    console.log('Article extracted:', result);
  };

  const handleArticleSaved = async (data: SaveArticleData) => {
    try {
      await articleAPI.saveArticle(data);
      setShowSuccess(true);
      setSuccessMessage('Article saved successfully!');
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      setViewMode('articles');

      // Refresh articles list
      const updatedArticles = await articleAPI.getArticles();
      setArticles(updatedArticles);
    } catch (error) {
      console.error('Failed to save article:', error);
    }
  };

  const handleAddClick = () => {
    setViewMode('add');
  };

  const handleBackToArticles = () => {
    setViewMode('articles');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                MCPress <span className="text-blue-600">Portal</span>
              </h1>
              {env.useMock && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                  MOCK MODE
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {viewMode === 'articles' && (
                <Button onClick={handleAddClick} testID="add-article-btn">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Article
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right duration-300">
          <div className="flex items-center gap-3 px-6 py-4 bg-green-500 dark:bg-green-600 text-white rounded-xl shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {viewMode === 'add' ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <button
              onClick={handleBackToArticles}
              className="mb-8 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Articles
            </button>
            <AddArticleForm
              onArticleExtracted={handleArticleExtracted}
              onArticleSaved={handleArticleSaved}
            />
          </div>
        ) : (
          <div>
            {articles.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                  No articles yet
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md">
                  Get started by adding your first article. Paste a URL and we will extract the content for you.
                </p>
                <Button onClick={handleAddClick} size="lg">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your First Article
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    Your Articles
                  </h2>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {articles.length} article{articles.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-zinc-500 dark:text-zinc-600 text-sm">
        {env.useMock && (
          <span className="block mb-2">Running in mock mode - data is simulated</span>
        )}
        © 2026 MCPress. All rights reserved.
      </footer>
    </div>
  );
};
