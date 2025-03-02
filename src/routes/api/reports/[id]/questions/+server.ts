import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { reports } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateFeedback } from '$lib/deep-research/feedback';

export const GET: RequestHandler = async ({ params }) => {
  try {
    // Get the report
    const reportId = params.id;
    if (!reportId || !isValidUUID(reportId)) {
      return json({ error: 'Invalid report ID' }, { status: 400 });
    }

    const report = await db.query.reports.findFirst({
      where: eq(reports.id, reportId)
    });

    if (!report) {
      return json({ error: 'Report not found' }, { status: 404 });
    }

    // Generate follow-up questions
    const questions = await generateFeedback({
      query: report.topic
    });

    return json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Failed to generate questions' },
      { status: 500 }
    );
  }
};

// UUID validation helper
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
} 