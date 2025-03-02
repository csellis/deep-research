import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { reports } from '$lib/server/db/schema';
import { deepResearch, writeFinalReport } from '$lib/deep-research/deep-research';
import { generateFeedback } from '$lib/deep-research/feedback';
import { OutputManager } from '$lib/deep-research/output-manager';
import { JINA_API_KEY } from '$env/static/private';

// Map to store active research jobs
const activeJobs = new Map<string, { cancel: () => void }>();

export function getActiveJobs() {
	return Array.from(activeJobs.keys());
}

export async function startResearchJob(
	reportId: string,
	options: {
		breadth: number;
		depth: number;
		answers?: string[];
	}
) {
	// Validate UUID
	if (!isValidUUID(reportId)) {
		throw new Error('Invalid report ID format');
	}

	// Check if job is already running
	if (activeJobs.has(reportId)) {
		console.log(`Research job for report ${reportId} is already running`);
		return;
	}

	console.log(`Starting research job for report ${reportId}`);
	console.log(`Parameters: breadth=${options.breadth}, depth=${options.depth}`);

	// Create a cancellation token
	let isCancelled = false;
	const cancel = () => {
		isCancelled = true;
		activeJobs.delete(reportId);
	};

	// Store the job
	activeJobs.set(reportId, { cancel });

	try {
		const report = await db.query.reports.findFirst({
			where: eq(reports.id, reportId)
		});

		if (!report) {
			console.error(`Report ${reportId} not found`);
			activeJobs.delete(reportId);
			return;
		}

		// Create output manager
		const output = new OutputManager();

		// Generate follow-up questions if no answers provided
		let followUpQuestions: string[] = [];
		let answers: string[] = options.answers || [];

		if (!options.answers) {
			followUpQuestions = await generateFeedback({
				query: report.topic
			});
			// Use description as default answer for all questions
			answers = Array(followUpQuestions.length).fill(report.description);
		}

		// Combine all information for deep research
		const combinedQuery = `
Initial Query: ${report.topic}
Description: ${report.description}
Follow-up Questions and Answers:
${followUpQuestions.map((q: string, i: number) => `Q: ${q}\nA: ${answers[i]}`).join('\n')}
`;

		// Update the report to show we're starting research
		await db
			.update(reports)
			.set({
				content: `## Research Starting\n\nPreparing to research: ${report.topic}`,
				metadata: JSON.stringify({
					breadth: options.breadth,
					depth: options.depth,
					followUpQuestions,
					answers
				}),
				status: 'processing',
				updated_at: new Date()
			})
			.where(eq(reports.id, reportId));

		// Start the research process
		const { learnings, visitedUrls } = await deepResearch({
			query: combinedQuery,
			breadth: options.breadth,
			depth: options.depth,
			searchProvider: {
				provider: 'jina',
				apiKey: JINA_API_KEY || ''
			},
			onProgress: async (progress) => {
				if (isCancelled) return;

				// Calculate percentage based on completed queries and total queries
				const percentage = (progress.completedQueries / progress.totalQueries) * 100;

				// Update the report with progress information
				await db
					.update(reports)
					.set({
						content: `## Research in Progress (${Math.round(percentage)}%)\n\n${progress.currentQuery || 'Initializing...'}`,
						updated_at: new Date()
					})
					.where(eq(reports.id, reportId));
			}
		});

		if (isCancelled) return;

		// Generate the final report
		const finalReport = await writeFinalReport({
			prompt: combinedQuery,
			learnings,
			visitedUrls
		});

		// Update the report with the final content
		await db
			.update(reports)
			.set({
				content: finalReport,
				status: 'completed',
				updated_at: new Date()
			})
			.where(eq(reports.id, reportId));

		console.log(`Research job for report ${reportId} completed`);
	} catch (error) {
		console.error(`Error in research job for report ${reportId}:`, error);

		// Update the report with the error
		await db
			.update(reports)
			.set({
				content: `## Error\n\nAn error occurred while generating this report: ${error}`,
				status: 'error',
				updated_at: new Date()
			})
			.where(eq(reports.id, reportId));
	} finally {
		activeJobs.delete(reportId);
	}
}

export async function startResearchWithAnswers(options: {
	reportId: string;
	answers: string[];
	breadth: number;
	depth: number;
}) {
	const { reportId, answers, breadth, depth } = options;
	await startResearchJob(reportId, { breadth, depth, answers });
}

export function cancelResearchJob(reportId: string) {
	if (!isValidUUID(reportId)) {
		throw new Error('Invalid report ID format');
	}

	const job = activeJobs.get(reportId);
	if (job) {
		job.cancel();
		console.log(`Research job for report ${reportId} cancelled`);
		return true;
	}
	return false;
}

// UUID validation helper
function isValidUUID(uuid: string) {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(uuid);
}

const defaultMetadata = {
	currentDepth: 0,
	totalDepth: 0,
	currentBreadth: 0,
	totalBreadth: 0,
	currentQuery: '',
	totalQueries: 0,
	completedQueries: 0,
	lastUpdated: new Date().toISOString()
};
