import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { reports } from '$lib/server/schema';

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

    return {
      report
    };
  } catch (err) {
    console.error('Failed to load report:', err);
    throw error(500, 'Failed to load report');
  }
}; 