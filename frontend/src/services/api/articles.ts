/**
 * API service for communicating with the MCPress backend.
 * Supports mock mode for testing without a running backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

// Mock data for testing
const MOCK_EXTRACT_RESPONSE = {
  url: 'https://example.com/article',
  data: {
    title: 'The Future of AI in Journalism: A Comprehensive Analysis',
    author: 'Sarah Chen',
    published_date: '2024-01-28',
    content: `# The Future of AI in Journalism

Artificial intelligence is revolutionizing how news is gathered, produced, and consumed. From automated fact-checking to personalized content delivery, AI technologies are transforming every aspect of the journalism industry.

## Key Takeaways

1. **Automated Reporting**: AI can now generate basic news stories for financial reports, sports summaries, and weather forecasts.

2. **Enhanced Fact-Checking**: Machine learning algorithms can help verify claims and detect misinformation.

3. **Personalization**: News apps use AI to recommend content tailored to individual reader preferences.

4. **Translation and Accessibility**: Real-time translation is breaking down language barriers in global news consumption.

## Challenges Ahead

Despite these advances, challenges remain. Concerns about job displacement, algorithmic bias, and the spread of deepfakes continue to spark debate in newsrooms worldwide.

"The integration of AI into journalism must be guided by ethical principles and a commitment to truth," says Dr. James Morrison, a media studies professor at Columbia University.

## Looking Forward

As AI capabilities continue to evolve, the most successful news organizations will be those that find the right balance between technological innovation and human judgment.`,
    summary: 'This article explores how artificial intelligence is transforming journalism through automated reporting, enhanced fact-checking, and personalized content delivery, while also examining the challenges of algorithmic bias and job displacement concerns.',
    keywords: ['AI', 'journalism', 'technology', 'automation', 'media', 'artificial intelligence', 'news', 'digital transformation'],
    category: 'technology',
  },
};

const MOCK_SAVE_RESPONSE = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  url: 'https://example.com/article',
  title: 'The Future of AI in Journalism: A Comprehensive Analysis',
  message: 'Article saved successfully',
};

const MOCK_ARTICLES: Record<string, unknown>[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    url: 'https://techcrunch.com/ai-startup-funding',
    title: 'AI Startup Funding Reaches Record High in Q4',
    author: 'Michael Rodriguez',
    published_date: '2024-01-25',
    content: 'Content about AI startup funding...',
    summary: 'Venture capital investment in AI startups reached unprecedented levels in the fourth quarter of 2023.',
    keywords: ['AI', 'startups', 'funding', 'venture capital', 'tech'],
    category: 'technology',
    organization: 'TechCrunch',
    image_url: null,
    created_at: '2024-01-26T10:00:00Z',
    updated_at: '2024-01-26T10:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    url: 'https://bbc.com/climate-summit-results',
    title: 'Global Climate Summit Produces Historic Agreement',
    author: 'Emma Thompson',
    published_date: '2024-01-24',
    content: 'Content about climate summit...',
    summary: 'World leaders have reached a landmark agreement on carbon emissions at the annual climate summit.',
    keywords: ['climate', 'environment', 'politics', 'global warming', 'summit'],
    category: 'politics',
    organization: 'BBC News',
    image_url: null,
    created_at: '2024-01-25T14:30:00Z',
    updated_at: '2024-01-25T14:30:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    url: 'https://theverge.com/apple-vision-pro-review',
    title: 'Apple Vision Pro Review: A Glimpse Into the Future',
    author: 'David Pierce',
    published_date: '2024-01-27',
    content: 'Content about Apple Vision Pro...',
    summary: 'Apple Vision Pro offers a revolutionary spatial computing experience, but comes with a steep learning curve.',
    keywords: ['Apple', 'VR', 'AR', 'technology', 'review', 'hardware'],
    category: 'technology',
    organization: 'The Verge',
    image_url: null,
    created_at: '2024-01-28T09:00:00Z',
    updated_at: '2024-01-28T09:00:00Z',
  },
];

// Simulate network delay
const simulateDelay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));

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
    if (USE_MOCK) {
      console.log('[MOCK] Extracting article from:', url);
      await simulateDelay(2000);
      return MOCK_EXTRACT_RESPONSE;
    }

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
    if (USE_MOCK) {
      console.log('[MOCK] Saving article:', data.title);
      await simulateDelay(1500);
      return MOCK_SAVE_RESPONSE;
    }

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
    if (USE_MOCK) {
      console.log('[MOCK] Getting article:', articleId);
      await simulateDelay(500);
      return MOCK_ARTICLES[0] as Article;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/articles/${articleId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<Article>(response);
  },

  /**
   * Get all articles (mock).
   */
  async getArticles(): Promise<Article[]> {
    if (USE_MOCK) {
      console.log('[MOCK] Getting all articles');
      await simulateDelay(800);
      return MOCK_ARTICLES as Article[];
    }

    // If not mock, return empty array (no list endpoint yet)
    return [];
  },

  /**
   * Health check for the backend API.
   */
  async healthCheck(): Promise<{ status: string }> {
    if (USE_MOCK) {
      await simulateDelay(200);
      return { status: 'healthy' };
    }

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

// Export mock mode status for debugging
export const isMockMode = USE_MOCK;
