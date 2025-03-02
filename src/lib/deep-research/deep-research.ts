import { generateObject } from 'ai';
import { compact } from 'lodash-es';
import pLimit from 'p-limit';
import { z } from 'zod';

import { o3MiniModel, trimPrompt } from './ai/providers';
import { OutputManager } from './output-manager';
import { systemPrompt } from './prompt';
import { createSearchProvider, type SearchProviderConfig } from './search';

// Initialize output manager for coordinated console/progress output
const output = new OutputManager();

// Replace console.log with output.log
function log(...args: any[]) {
	output.log(...args);
}

export type ResearchProgress = {
	currentDepth: number;
	totalDepth: number;
	currentBreadth: number;
	totalBreadth: number;
	currentQuery?: string;
	totalQueries: number;
	completedQueries: number;
};

type ResearchResult = {
	learnings: string[];
	visitedUrls: string[];
};

// increase this if you have higher API rate limits
const ConcurrencyLimit = 2;

// take en user query, return a list of SERP queries
async function generateSerpQueries({
	query,
	numQueries = 3,
	learnings
}: {
	query: string;
	numQueries?: number;
	// optional, if provided, the research will continue from the last learning
	learnings?: string[];
}) {
	log(`Generating SERP queries for: "${query.substring(0, 100)}..."`);
	log(`Target number of queries: ${numQueries}`);

	if (learnings && learnings.length > 0) {
		log(`Using ${learnings.length} existing learnings to inform query generation`);
	}

	try {
		const res = await generateObject({
			model: o3MiniModel,
			system: systemPrompt(),
			prompt: `Given the following prompt from the user, generate a list of SERP queries to research the topic. Return a maximum of ${numQueries} queries, but feel free to return less if the original prompt is clear. Make sure each query is unique and not similar to each other: <prompt>${query}</prompt>\n\n${learnings
				? `Here are some learnings from previous research, use them to generate more specific queries: ${learnings.join(
					'\n'
				)}`
				: ''
				}`,
			schema: z.object({
				queries: z
					.array(
						z.object({
							query: z.string().describe('The SERP query'),
							researchGoal: z
								.string()
								.describe(
									'First talk about the goal of the research that this query is meant to accomplish, then go deeper into how to advance the research once the results are found, mention additional research directions. Be as specific as possible, especially for additional research directions.'
								)
						})
					)
					.describe(`List of SERP queries, max of ${numQueries}`)
			})
		});

		log(`Successfully generated ${res.object.queries.length} SERP queries`);
		res.object.queries.forEach((q, i) => {
			log(`  Query ${i + 1}: "${q.query}"`);
			log(`    Goal: ${q.researchGoal.substring(0, 150)}...`);
		});

		return res.object.queries.slice(0, numQueries);
	} catch (error: any) {
		log(`Error generating SERP queries: ${error.message || error}`);
		console.error(error);
		return [];
	}
}

async function processSerpResult({
	query,
	result,
	numLearnings = 3,
	numFollowUpQuestions = 3
}: {
	query: string;
	result: any;
	numLearnings?: number;
	numFollowUpQuestions?: number;
}) {
	log(`Processing SERP results for query: "${query}"`);
	log(`Result contains ${result.data.length} items`);

	const contents = compact(result.data.map((item: any) => item.markdown))
		.filter((content): content is string => typeof content === 'string')
		.map((content: string) => trimPrompt(content, 25_000));
	log(`Extracted ${contents.length} markdown contents from results`);

	if (contents.length === 0) {
		log(`Warning: No content found for query "${query}"`);
		return { learnings: [], followUpQuestions: [] };
	}

	log(`Total content size: ${contents.reduce((sum, c) => sum + c.length, 0)} characters`);
	log(`Generating learnings and follow-up questions...`);

	try {
		const res = await generateObject({
			model: o3MiniModel,
			abortSignal: AbortSignal.timeout(60_000),
			system: systemPrompt(),
			prompt: `Given the following contents from a SERP search for the query <query>${query}</query>, generate a list of learnings from the contents. Return a maximum of ${numLearnings} learnings, but feel free to return less if the contents are clear. Make sure each learning is unique and not similar to each other. The learnings should be concise and to the point, as detailed and information dense as possible. Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any exact metrics, numbers, or dates. The learnings will be used to research the topic further.\n\n<contents>${contents
				.map((content: string) => `<content>\n${content}\n</content>`)
				.join('\n')}</contents>`,
			schema: z.object({
				learnings: z.array(z.string()).describe(`List of learnings, max of ${numLearnings}`),
				followUpQuestions: z
					.array(z.string())
					.describe(
						`List of follow-up questions to research the topic further, max of ${numFollowUpQuestions}`
					)
			})
		});

		log(`Successfully generated ${res.object.learnings.length} learnings and ${res.object.followUpQuestions.length} follow-up questions`);
		res.object.learnings.forEach((l, i) => log(`  Learning ${i + 1}: ${l.substring(0, 100)}...`));
		res.object.followUpQuestions.forEach((q, i) => log(`  Follow-up ${i + 1}: ${q}`));

		return res.object;
	} catch (error: any) {
		log(`Error generating learnings: ${error.message || error}`);
		console.error(error);
		return { learnings: [], followUpQuestions: [] };
	}
}

export async function writeFinalReport({
	prompt,
	learnings,
	visitedUrls
}: {
	prompt: string;
	learnings: string[];
	visitedUrls: string[];
}) {
	log(`Starting final report generation for prompt: "${prompt.substring(0, 100)}..."`);
	log(`Using ${learnings.length} learnings and ${visitedUrls.length} sources`);

	const learningsString = trimPrompt(
		learnings.map((learning) => `<learning>\n${learning}\n</learning>`).join('\n'),
		150_000
	);
	log(`Formatted learnings for report generation (${learningsString.length} characters)`);

	log(`Generating final report...`);
	const res = await generateObject({
		model: o3MiniModel,
		system: systemPrompt(),
		prompt: `Given the following prompt from the user, write a final report on the topic using the learnings from research. Make it as as detailed as possible, aim for 3 or more pages, include ALL the learnings from research:\n\n<prompt>${prompt}</prompt>\n\nHere are all the learnings from previous research:\n\n<learnings>\n${learningsString}\n</learnings>`,
		schema: z.object({
			reportMarkdown: z.string().describe('Final report on the topic in Markdown')
		})
	});
	log(`Report generation complete (${res.object.reportMarkdown.length} characters)`);

	// Append the visited URLs section to the report
	const urlsSection = `\n\n## Sources\n\n${visitedUrls.map((url) => `- ${url}`).join('\n')}`;
	log(`Added ${visitedUrls.length} sources to the report`);

	const finalReport = res.object.reportMarkdown + urlsSection;
	log(`Final report complete (${finalReport.length} characters)`);

	return finalReport;
}

export async function deepResearch({
	query,
	breadth,
	depth,
	searchProvider = { provider: 'jina' as const },
	learnings = [],
	visitedUrls = [],
	onProgress
}: {
	query: string;
	breadth: number;
	depth: number;
	searchProvider?: SearchProviderConfig;
	learnings?: string[];
	visitedUrls?: string[];
	onProgress?: (progress: ResearchProgress) => void;
}): Promise<ResearchResult> {
	log(`Starting deep research with query: "${query}"`);
	log(`Parameters: breadth=${breadth}, depth=${depth}, existing learnings=${learnings.length}`);
	log(`Using search provider: ${searchProvider.provider}`);

	const provider = createSearchProvider(searchProvider);

	const progress: ResearchProgress = {
		currentDepth: depth,
		totalDepth: depth,
		currentBreadth: breadth,
		totalBreadth: breadth,
		totalQueries: 0,
		completedQueries: 0
	};

	const reportProgress = (update: Partial<ResearchProgress>) => {
		Object.assign(progress, update);
		onProgress?.(progress);

		// Log progress updates
		if (update.currentQuery) {
			log(`Processing query: "${update.currentQuery}"`);
		}
		if (update.completedQueries !== undefined) {
			log(`Progress: ${update.completedQueries}/${progress.totalQueries} queries completed`);
		}
	};

	log(`Generating SERP queries for: "${query}"`);
	const serpQueries = await generateSerpQueries({
		query,
		learnings,
		numQueries: breadth
	});

	log(`Generated ${serpQueries.length} SERP queries for research`);
	serpQueries.forEach((q, i) => log(`  Query ${i + 1}: "${q.query}" - Goal: ${q.researchGoal.substring(0, 100)}...`));

	reportProgress({
		totalQueries: serpQueries.length,
		currentQuery: serpQueries[0]?.query
	});

	const limit = pLimit(ConcurrencyLimit);
	log(`Using concurrency limit of ${ConcurrencyLimit} for API requests`);

	const results = await Promise.all(
		serpQueries.map((serpQuery, index) =>
			limit(async () => {
				try {
					log(`Executing search ${index + 1}/${serpQueries.length}: "${serpQuery.query}"`);
					const result = await provider.search(serpQuery.query, {
						timeout: 15000,
						limit: 5,
						scrapeOptions: { formats: ['markdown'] }
					});

					// Collect URLs from this search
					const newUrls = compact(result.data.map((item) => item.url));
					log(`Found ${result.data.length} results, ${newUrls.length} unique URLs`);

					const newBreadth = Math.ceil(breadth / 2);
					const newDepth = depth - 1;

					log(`Processing search results for query: "${serpQuery.query}"`);
					const newLearnings = await processSerpResult({
						query: serpQuery.query,
						result,
						numFollowUpQuestions: newBreadth
					});

					log(`Extracted ${newLearnings.learnings.length} learnings and ${newLearnings.followUpQuestions.length} follow-up questions`);

					const allLearnings = [...learnings, ...newLearnings.learnings];
					const allUrls = [...visitedUrls, ...newUrls];

					if (newDepth > 0) {
						log(`Continuing research at depth ${newDepth}, breadth ${newBreadth}`);

						reportProgress({
							currentDepth: newDepth,
							currentBreadth: newBreadth,
							completedQueries: progress.completedQueries + 1,
							currentQuery: serpQuery.query
						});

						const nextQuery = `
            Previous research goal: ${serpQuery.researchGoal}
            Follow-up research directions: ${newLearnings.followUpQuestions.map((q) => `\n${q}`).join('')}
          `.trim();

						log(`Starting next research level with query based on follow-up questions`);
						return deepResearch({
							query: nextQuery,
							breadth: newBreadth,
							depth: newDepth,
							searchProvider,
							learnings: allLearnings,
							visitedUrls: allUrls,
							onProgress
						});
					} else {
						log(`Reached maximum depth, completing research branch for query: "${serpQuery.query}"`);
						reportProgress({
							currentDepth: 0,
							completedQueries: progress.completedQueries + 1,
							currentQuery: serpQuery.query
						});
						return {
							learnings: allLearnings,
							visitedUrls: allUrls
						};
					}
				} catch (e: any) {
					if (e.message && e.message.includes('Timeout')) {
						log(`Timeout error running query: "${serpQuery.query}": ${e.message}`);
					} else {
						log(`Error running query: "${serpQuery.query}": ${e.message || e}`);
						console.error(e); // Log full error for debugging
					}
					reportProgress({
						completedQueries: progress.completedQueries + 1
					});
					return {
						learnings: [],
						visitedUrls: []
					};
				}
			})
		)
	);

	const finalLearnings = [...new Set(results.flatMap((r) => r.learnings))];
	const finalUrls = [...new Set(results.flatMap((r) => r.visitedUrls))];

	log(`Research complete. Collected ${finalLearnings.length} unique learnings and ${finalUrls.length} unique URLs`);

	return {
		learnings: finalLearnings,
		visitedUrls: finalUrls
	};
}
