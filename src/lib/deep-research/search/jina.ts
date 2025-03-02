import type { SearchProvider, SearchOptions, SearchResponse } from './types';

export class JinaProvider implements SearchProvider {
  private apiKey?: string;
  name = 'jina';

  constructor(config?: { apiKey?: string }) {
    this.apiKey = config?.apiKey ?? process.env.JINA_API_KEY;
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
      method: 'GET',
      headers,
      signal: options?.timeout ? AbortSignal.timeout(options.timeout) : undefined
    });

    if (!response.ok) {
      throw new Error(`Jina search failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform Jina response to our SearchResponse format
    return {
      data: data.results.map((result: any) => ({
        url: result.url,
        title: result.title,
        snippet: result.snippet,
        markdown: result.content // Jina returns clean, LLM-friendly content
      }))
    };
  }
} 