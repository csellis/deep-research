import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { reports } from '$lib/server/schema';
import { startInteractiveResearchJob } from '$lib/server/jobs';

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const reportId = params.id;

    // Verify the report exists
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);

    if (!report) {
      return json({ error: 'Report not found' }, { status: 404 });
    }

    // Get request body
    const body = await request.json();
    const { breadth, depth, followUpQuestions, answers } = body;

    // Start the interactive research job
    startInteractiveResearchJob(reportId, {
      breadth,
      depth,
      followUpQuestions,
      answers
    });

    return json({ success: true });
  } catch (error) {
    console.error('Error starting research:', error);
    return json({ error: 'Failed to start research' }, { status: 500 });
  }
}; 