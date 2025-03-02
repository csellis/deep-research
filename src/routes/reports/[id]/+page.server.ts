import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { reports } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
  try {
    // Validate report ID
    const reportId = params.id;
    if (!reportId || !isValidUUID(reportId)) {
      console.error(`Invalid report ID: ${params.id}`);
      throw error(400, 'Invalid report ID');
    }

    try {
      // Query the database for the report
      const result = await db.select().from(reports).where(eq(reports.id, reportId));
      const report = result[0];

      if (!report) {
        console.error(`Report not found with ID: ${reportId}`);
        throw error(404, 'Report not found');
      }

      return {
        report: {
          ...report,
          metadata: JSON.parse(report.metadata || '{}')
        }
      };
    } catch (err: any) {
      // Check if it's a SvelteKit error
      if (err.status) throw err;

      console.error('Database error while loading report:', err);
      throw error(500, 'Failed to load report');
    }
  } catch (err: any) {
    // Re-throw SvelteKit errors
    if (err.status) throw err;

    console.error('Unexpected error while loading report:', err);
    throw error(500, 'An unexpected error occurred');
  }
};

// UUID validation helper
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
} 