import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { reports } from '$lib/server/schema';
import { desc } from 'drizzle-orm';

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

    if (!topic || !description) {
      throw error(400, 'Topic and description are required');
    }

    try {
      const result = await db.insert(reports).values({
        topic,
        description,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      }).returning();

      return { success: true, report: result[0] };
    } catch (err) {
      console.error('Failed to create report:', err);
      throw error(500, 'Failed to create report');
    }
  }
}; 