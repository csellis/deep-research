import type { SearchProvider, SearchOptions, SearchResponse } from './types';

/**
 * Sleep utility function for retry logic
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class JinaProvider implements SearchProvider {
	private apiKey?: string;
	name = 'jina';
	private maxRetries = 3;
	private defaultTimeout = 30000; // 30 seconds default timeout

	// Get your Jina AI API key for free: https://jina.ai/?sui=apikey
	constructor(config?: { apiKey?: string; maxRetries?: number; defaultTimeout?: number }) {
		this.apiKey = config?.apiKey ?? process.env.JINA_API_KEY;
		this.maxRetries = config?.maxRetries ?? 3;
		this.defaultTimeout = config?.defaultTimeout ?? 30000;
	}

	async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			Accept: 'application/json'
		};

		if (this.apiKey) {
			headers['Authorization'] = `Bearer ${this.apiKey}`;
		}

		// Use provided timeout or default
		const timeout = options?.timeout ?? this.defaultTimeout;
		let lastError: Error | null = null;

		// Retry logic with exponential backoff
		for (let attempt = 0; attempt < this.maxRetries; attempt++) {
			try {
				console.log(
					`Searching Jina with query (attempt ${attempt + 1}/${this.maxRetries}):`,
					query
				);

				// Create a new AbortController for each attempt
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), timeout);

				try {
					const response = await fetch(`https://s.jina.ai/`, {
						method: 'POST',
						headers,
						body: JSON.stringify({ q: query }),
						signal: controller.signal
					});

					// Clear the timeout as request completed
					clearTimeout(timeoutId);

					if (!response.ok) {
						const errorText = await response.text();
						console.error(`Jina API error (attempt ${attempt + 1}/${this.maxRetries}):`, errorText);

						// Handle rate limiting (429) with longer backoff
						if (response.status === 429) {
							const retryAfter = response.headers.get('Retry-After');
							const waitTime = retryAfter
								? parseInt(retryAfter, 10) * 1000
								: Math.pow(2, attempt) * 1000;
							console.log(`Rate limited. Waiting ${waitTime}ms before retry.`);
							await sleep(waitTime);
							continue;
						}

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
				} finally {
					// Ensure timeout is cleared if there was an exception
					clearTimeout(timeoutId);
				}
			} catch (error) {
				lastError = error as Error;
				console.error(`Error in Jina search (attempt ${attempt + 1}/${this.maxRetries}):`, error);

				// If it's not a timeout error, or it's the last attempt, don't retry
				if (
					!(error instanceof DOMException && error.name === 'TimeoutError') &&
					attempt === this.maxRetries - 1
				) {
					throw error;
				}

				// Exponential backoff before retry
				const backoffTime = Math.min(Math.pow(2, attempt) * 1000, 10000); // Max 10 seconds
				console.log(`Retrying in ${backoffTime}ms...`);
				await sleep(backoffTime);
			}
		}

		// If we've exhausted all retries
		throw lastError || new Error('Failed to get search results after multiple attempts');
	}
}
