/**
 * Centralized environment variable configuration.
 * All environment variables should be accessed through this config object.
 */

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  llmModel: process.env.NEXT_PUBLIC_LLM_MODEL || 'gpt-4o',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};

// Simple validation to ensure required environment variables are set
if (env.isProduction && !process.env.NEXT_PUBLIC_APP_URL) {
  console.warn('Warning: NEXT_PUBLIC_APP_URL is not set in production.');
}
