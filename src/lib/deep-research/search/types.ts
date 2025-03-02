export interface SearchResult {
	url: string;
	title: string;
	snippet: string;
	markdown?: string;
}

export interface SearchResponse {
	data: SearchResult[];
}

export interface SearchProvider {
	name: string;
	search(query: string, options?: SearchOptions): Promise<SearchResponse>;
}

export interface SearchOptions {
	timeout?: number;
	limit?: number;
	scrapeOptions?: {
		formats?: string[];
	};
}
