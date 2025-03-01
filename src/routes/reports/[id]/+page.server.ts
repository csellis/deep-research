import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { reports } from '$lib/server/schema';
import { startResearchJob, getActiveJobs } from '$lib/server/jobs';

export const load: PageServerLoad = async ({ params }) => {
  try {
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, params.id))
      .limit(1);

    if (!report) {
      throw error(404, 'Report not found');
    }

    // Check if this report is currently being processed
    const activeJobs = getActiveJobs();
    const isProcessing = activeJobs.includes(params.id);

    return {
      report,
      isProcessing
    };
  } catch (err) {
    console.error('Failed to load report:', err);
    throw error(500, 'Failed to load report');
  }
};

export const actions: Actions = {
  startResearch: async ({ params }) => {
    try {
      const reportId = params.id;

      // Start the research job
      startResearchJob(reportId);

      return { success: true };
    } catch (err) {
      console.error('Failed to start research:', err);
      throw error(500, 'Failed to start research');
    }
  }
}; 