/**
 * API service for communicating with the MCPress backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ExtractRequest {
  url: string;
}

interface ArticleContent {
  title: string;
  author: string | null;
  published_date: string | null;
  content: string;
  summary: string;
  keywords: string[];
  category: string;
}

interface ExtractResponse {
  url: string;
  data: ArticleContent;
}

interface OrganizationInfo {
  name: string;
  email: string;
}

interface SaveRequest {
  url: string;
  title: string;
  author: string | null;
  published_date: string | null;
  content: string;
  summary: string;
  keywords: string[];
  category: string;
  organization?: OrganizationInfo;
  image_url?: string;
}

interface SaveResponse {
  id: string;
  url: string;
  title: string;
  message: string;
}

interface Article {
  id: string;
  url: string;
  title: string;
  author: string | null;
  published_date: string | null;
  content: string;
  summary: string;
  keywords: string[];
  category: string | null;
  organization: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface ErrorResponse {
  detail: string;
  status_code: number;
}

class ArticleAPIError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ArticleAPIError';
    this.statusCode = statusCode;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ErrorResponse = await response.json().catch(() => ({
      detail: 'An error occurred',
      status_code: response.status,
    }));
    throw new ArticleAPIError(error.detail, error.status_code);
  }
  return response.json();
}

export const articleAPI = {
  /**
   * Extract article content and metadata from a URL.
   * Uses Jina.ai for scraping and Groq for AI extraction.
   */
  async extractArticle(url: string): Promise<ExtractResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/articles/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url } as ExtractRequest),
    });

    return handleResponse<ExtractResponse>(response);
  },

  /**
   * Save an article to the database with its embedding.
   */
  async saveArticle(data: SaveRequest): Promise<SaveResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/articles/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return handleResponse<SaveResponse>(response);
  },

  /**
   * Get an article by ID.
   */
  async getArticle(articleId: string): Promise<Article> {
    const response = await fetch(`${API_BASE_URL}/api/v1/articles/${articleId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<Article>(response);
  },

  /**
   * Health check for the backend API.
   */
  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<{ status: string }>(response);
  },
};

export type {
  Article,
  ArticleContent,
  ExtractRequest,
  ExtractResponse,
  OrganizationInfo,
  SaveRequest,
  SaveResponse,
};
