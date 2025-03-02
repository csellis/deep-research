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

    try {
      console.log('Searching Jina with query:', query);

      const response = await fetch(`https://api.jina.ai/v1/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          top_k: options?.limit || 10
        }),
        signal: options?.timeout ? AbortSignal.timeout(options.timeout) : undefined
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jina API error:', errorText);
        throw new Error(`Jina search failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Jina response:', JSON.stringify(data, null, 2));

      if (!data.results || !Array.isArray(data.results)) {
        console.error('Unexpected Jina response format:', data);
        throw new Error('Invalid response format from Jina API');
      }

      // Transform Jina response to our SearchResponse format
      return {
        data: data.results.map((result: any) => ({
          url: result.url || 'No URL provided',
          title: result.title || 'No title available',
          snippet: result.snippet || result.text || 'No snippet available',
          markdown: result.content || result.text || result.snippet || 'No content available'
        }))
      };
    } catch (error) {
      console.error('Error in Jina search:', error);
      throw error;
    }
  }
} 