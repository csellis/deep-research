import { db } from '$lib/server/db';
import { reports } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { deepResearch, writeFinalReport } from '$lib/deep-research/deep-research';
import { generateFeedback } from '$lib/deep-research/feedback';
import { OutputManager } from '$lib/deep-research/output-manager';

// Map to store active research jobs
const activeJobs = new Map<string, { cancel: () => void }>();

export async function startResearchJob(
  reportId: string,
  options?: {
    breadth?: number;
    depth?: number;
  }
) {
  // Check if job is already running
  if (activeJobs.has(reportId)) {
    console.log(`Research job for report ${reportId} is already running`);
    return;
  }

  console.log(`Starting research job for report ${reportId}`);
  if (options) {
    console.log(`Parameters: breadth=${options.breadth}, depth=${options.depth}`);
  }

  // Create a cancellation token
  let isCancelled = false;
  const cancel = () => {
    isCancelled = true;
    activeJobs.delete(reportId);
  };

  // Store the job
  activeJobs.set(reportId, { cancel });

  try {
    // Get the report
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);

    if (!report) {
      console.error(`Report ${reportId} not found`);
      activeJobs.delete(reportId);
      return;
    }

    // Create output manager
    const output = new OutputManager();

    // Generate follow-up questions
    const followUpQuestions = await generateFeedback({
      query: report.topic
    });

    // Since we don't have user interaction here, we'll use the description as the answer
    // to all follow-up questions
    const answers = Array(followUpQuestions.length).fill(report.description);

    // Combine all information for deep research
    const combinedQuery = `
Initial Query: ${report.topic}
Description: ${report.description}
Follow-up Questions and Answers:
${followUpQuestions.map((q: string, i: number) => `Q: ${q}\nA: ${answers[i]}`).join('\n')}
`;

    // Get research parameters from options or metadata or use defaults
    let breadth = 4;
    let depth = 2;

    if (options && options.breadth !== undefined && options.depth !== undefined) {
      breadth = options.breadth;
      depth = options.depth;
    } else if (report.metadata) {
      try {
        const metadata = JSON.parse(report.metadata);
        if (metadata.breadth) breadth = metadata.breadth;
        if (metadata.depth) depth = metadata.depth;
      } catch (e) {
        console.error(`Error parsing metadata for report ${reportId}:`, e);
      }
    }

    console.log(`Using research parameters: breadth=${breadth}, depth=${depth}`);

    // Start the research process
    const { learnings, visitedUrls } = await deepResearch({
      query: combinedQuery,
      breadth,
      depth,
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

// New function for interactive research with user-provided follow-up answers
export async function startInteractiveResearchJob(
  reportId: string,
  options: {
    breadth: number;
    depth: number;
    followUpQuestions: string[];
    answers: string[];
  }
) {
  // Check if job is already running
  if (activeJobs.has(reportId)) {
    console.log(`Research job for report ${reportId} is already running`);
    return;
  }

  console.log(`Starting interactive research job for report ${reportId}`);
  console.log(`Parameters: breadth=${options.breadth}, depth=${options.depth}`);
  console.log(`Follow-up questions: ${options.followUpQuestions.length}`);

  // Create a cancellation token
  let isCancelled = false;
  const cancel = () => {
    isCancelled = true;
    activeJobs.delete(reportId);
  };

  // Store the job
  activeJobs.set(reportId, { cancel });

  try {
    // Get the report
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);

    if (!report) {
      console.error(`Report ${reportId} not found`);
      activeJobs.delete(reportId);
      return;
    }

    // Create output manager
    const output = new OutputManager();

    // Combine all information for deep research
    const combinedQuery = `
Initial Query: ${report.topic}
Description: ${report.description}
Follow-up Questions and Answers:
${options.followUpQuestions.map((q, i) => `Q: ${q}\nA: ${options.answers[i] || 'No answer provided'}`).join('\n')}
`;

    // Update the report to show we're starting research
    await db
      .update(reports)
      .set({
        content: `## Research Starting\n\nPreparing to research: ${report.topic}`,
        metadata: JSON.stringify({
          breadth: options.breadth,
          depth: options.depth,
          followUpQuestions: options.followUpQuestions,
          answers: options.answers
        }),
        updated_at: new Date()
      })
      .where(eq(reports.id, reportId));

    // Start the research process
    const { learnings, visitedUrls } = await deepResearch({
      query: combinedQuery,
      breadth: options.breadth,
      depth: options.depth,
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

    console.log(`Interactive research job for report ${reportId} completed`);
  } catch (error) {
    console.error(`Error in interactive research job for report ${reportId}:`, error);

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

export function cancelResearchJob(reportId: string) {
  const job = activeJobs.get(reportId);
  if (job) {
    job.cancel();
    console.log(`Research job for report ${reportId} cancelled`);
    return true;
  }
  return false;
}

export function getActiveJobs() {
  return Array.from(activeJobs.keys());
} 