import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { reports } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import { startResearchJob } from '$lib/server/jobs';

export const load: PageServerLoad = async () => {
  try {
    const reportsList = await db
      .select()
      .from(reports)
      .orderBy(desc(reports.created_at));

    return {
      reports: reportsList
    };
  } catch (err) {
    console.error('Failed to load reports:', err);
    throw error(500, 'Failed to load reports');
  }
};

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const topic = data.get('topic')?.toString();
    const description = data.get('description')?.toString();

    // Get breadth and depth parameters
    const breadthStr = data.get('breadth')?.toString();
    const depthStr = data.get('depth')?.toString();

    // Parse breadth and depth with defaults
    const breadth = breadthStr ? parseInt(breadthStr, 10) : 4;
    const depth = depthStr ? parseInt(depthStr, 10) : 2;

    if (!topic || !description) {
      throw error(400, 'Topic and description are required');
    }

    try {
      const result = await db.insert(reports).values({
        topic,
        description,
        status: 'pending',
        metadata: JSON.stringify({ breadth, depth }),
        created_at: new Date(),
        updated_at: new Date()
      }).returning();

      const report = result[0];

      // Start the research job in the background with the specified parameters
      setTimeout(() => {
        startResearchJob(report.id.toString(), { breadth, depth });
      }, 100);

      return { success: true, report };
    } catch (err) {
      console.error('Failed to create report:', err);
      throw error(500, 'Failed to create report');
    }
  }
}; 