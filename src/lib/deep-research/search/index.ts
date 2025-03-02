export * from './types';
import { FirecrawlProvider } from './firecrawl';
import { JinaProvider } from './jina';
import type { SearchProvider } from './types';

export type SearchProviderName = 'jina' | 'firecrawl';

export interface SearchProviderConfig {
  provider: SearchProviderName;
  apiKey?: string;
  apiUrl?: string;
}

export function createSearchProvider(config: SearchProviderConfig): SearchProvider {
  // Default to Jina if no provider specified
  const provider = config?.provider || 'jina';

  switch (provider) {
    case 'jina':
      return new JinaProvider({ apiKey: config?.apiKey });
    case 'firecrawl':
      return new FirecrawlProvider({ apiKey: config?.apiKey, apiUrl: config?.apiUrl });
    default:
      throw new Error(`Unknown search provider: ${provider}`);
  }
} 