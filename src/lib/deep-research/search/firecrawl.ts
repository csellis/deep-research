import FirecrawlApp from '@mendable/firecrawl-js';
import type { SearchProvider, SearchOptions, SearchResponse } from './types';

export class FirecrawlProvider implements SearchProvider {
	private client: FirecrawlApp;
	name = 'firecrawl';

	constructor(config?: { apiKey?: string; apiUrl?: string }) {
		this.client = new FirecrawlApp({
			apiKey: config?.apiKey ?? process.env.FIRECRAWL_KEY ?? '',
			apiUrl: config?.apiUrl ?? process.env.FIRECRAWL_BASE_URL
		});
	}

	async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
		return this.client.search(query, {
			timeout: options?.timeout ?? 15000,
			limit: options?.limit ?? 5,
			scrapeOptions: options?.scrapeOptions ?? { formats: ['markdown'] }
		});
	}
}
