'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ArticleContent, ExtractionResult, SaveArticleData } from '@/types/article';
import { articleAPI } from '@/services/api/articles';

interface AddArticleFormProps {
  onArticleExtracted: (result: ExtractionResult) => void;
  onArticleSaved: () => void;
}

export const AddArticleForm: React.FC<AddArticleFormProps> = ({
  onArticleExtracted,
  onArticleSaved,
}) => {
  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ArticleContent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editableData, setEditableData] = useState<ArticleContent | null>(null);

  const handleExtract = async () => {
    if (!url.trim()) {
      setExtractionError('Please enter a valid URL');
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);

    try {
      const result = await articleAPI.extractArticle(url);
      setExtractedData(result.data);
      setEditableData(result.data);
      onArticleExtracted(result);
    } catch (error) {
      setExtractionError(
        error instanceof Error ? error.message : 'Failed to extract article'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!editableData) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const saveData: SaveArticleData = {
        url,
        title: editableData.title,
        author: editableData.author,
        published_date: editableData.published_date,
        content: editableData.content,
        summary: editableData.summary,
        keywords: editableData.keywords,
        category: editableData.category,
      };

      await articleAPI.saveArticle(saveData);
      onArticleSaved();
      handleReset();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Failed to save article'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setExtractedData(null);
    setEditableData(null);
    setExtractionError(null);
    setSaveError(null);
  };

  const updateField = (field: keyof ArticleContent, value: string | string[]) => {
    if (!editableData) return;
    setEditableData({ ...editableData, [field]: value });
  };

  if (!extractedData) {
    return (
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">
            Add New Article
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
            Paste a URL to extract and save an article to your collection.
          </p>
        </div>

        <div className="space-y-6">
          <div className="group">
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
              Article URL
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔗</span>
              <input
                type="url"
                placeholder="https://example.com/your-article"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setExtractionError(null);
                }}
                className="w-full pl-12 pr-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all dark:text-white text-lg placeholder:text-zinc-400"
              />
            </div>
          </div>

          {extractionError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400 text-sm">{extractionError}</p>
            </div>
          )}

          <Button
            onClick={handleExtract}
            disabled={isExtracting}
            className="w-full py-4 text-lg shadow-lg shadow-blue-500/20"
          >
            {isExtracting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Extracting...
              </span>
            ) : (
              'Extract Article'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">
            Review & Save Article
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            Review the extracted content and make any necessary edits before saving.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          ← Add Another
        </button>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div className="group">
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
            Title
          </label>
          <input
            type="text"
            value={editableData?.title || ''}
            onChange={(e) => updateField('title', e.target.value)}
            className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all dark:text-white text-lg"
          />
        </div>

        {/* Author and Category Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group">
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
              Author
            </label>
            <input
              type="text"
              value={editableData?.author || ''}
              onChange={(e) => updateField('author', e.target.value)}
              placeholder="Author name"
              className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all dark:text-white text-lg placeholder:text-zinc-400"
            />
          </div>

          <div className="group">
            <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
              Category
            </label>
            <input
              type="text"
              value={editableData?.category || ''}
              onChange={(e) => updateField('category', e.target.value)}
              placeholder="e.g., technology, politics"
              className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all dark:text-white text-lg placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="group">
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
            Summary
          </label>
          <textarea
            value={editableData?.summary || ''}
            onChange={(e) => updateField('summary', e.target.value)}
            rows={3}
            className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all dark:text-white text-lg resize-none"
          />
        </div>

        {/* Keywords */}
        <div className="group">
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
            Keywords (comma-separated)
          </label>
          <input
            type="text"
            value={editableData?.keywords?.join(', ') || ''}
            onChange={(e) => updateField('keywords', e.target.value.split(',').map(k => k.trim()))}
            placeholder="keyword1, keyword2, keyword3"
            className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all dark:text-white text-lg placeholder:text-zinc-400"
          />
        </div>

        {/* Content Preview */}
        <div className="group">
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
            Content Preview
          </label>
          <div className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl dark:text-white text-lg max-h-60 overflow-y-auto">
            {editableData?.content?.slice(0, 1000)}
            {editableData?.content && editableData.content.length > 1000 && '...'}
          </div>
        </div>

        {/* URL Display */}
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Source URL</p>
          <p className="text-zinc-900 dark:text-zinc-100 font-mono text-sm break-all">{url}</p>
        </div>

        {saveError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-600 dark:text-red-400 text-sm">{saveError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            onClick={handleReset}
            variant="secondary"
            className="flex-1 py-4 text-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-4 text-lg shadow-lg shadow-blue-500/20"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Article'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
