import type { SearchProvider, SearchOptions, SearchResponse } from './types';

export class JinaProvider implements SearchProvider {
  private apiKey?: string;
  name = 'jina';

  // Get your Jina AI API key for free: https://jina.ai/?sui=apikey
  constructor(config?: { apiKey?: string }) {
    this.apiKey = config?.apiKey ?? process.env.JINA_API_KEY;
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      console.log('Searching Jina with query:', query);

      const response = await fetch(`https://s.jina.ai/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ q: query }),
        signal: options?.timeout ? AbortSignal.timeout(options.timeout) : undefined
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jina API error:', errorText);
        throw new Error(`Jina search failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Jina response:', JSON.stringify(data, null, 2));

      if (!data.data || !Array.isArray(data.data)) {
        console.error('Unexpected Jina response format:', data);
        throw new Error('Invalid response format from Jina API');
      }

      // Transform Jina response to our SearchResponse format
      return {
        data: data.data.map((result: any) => ({
          url: result.url || 'No URL provided',
          title: result.title || 'No title available',
          snippet: result.content || 'No snippet available',
          markdown: result.content || 'No content available'
        }))
      };
    } catch (error) {
      console.error('Error in Jina search:', error);
      throw error;
    }
  }
} 