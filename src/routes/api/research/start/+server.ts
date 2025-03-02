import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { reports } from '$lib/server/schema';
import { startResearchWithAnswers } from '$lib/server/jobs';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      reportId,
      topic,
      description,
      breadth,
      depth,
      followUpQuestions,
      answers
    } = body;

    if (!reportId) {
      return json({ error: 'Report ID is required' }, { status: 400 });
    }

    if (!followUpQuestions || !answers || followUpQuestions.length !== answers.length) {
      return json({ error: 'Invalid questions or answers' }, { status: 400 });
    }

    // Verify the report exists
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);

    if (!report) {
      return json({ error: 'Report not found' }, { status: 404 });
    }

    // Update the report with the research parameters and answers
    await db
      .update(reports)
      .set({
        metadata: JSON.stringify({
          breadth,
          depth,
          followUpQuestions,
          answers
        }),
        updated_at: new Date()
      })
      .where(eq(reports.id, reportId));

    // Start the research job with the answers
    startResearchWithAnswers(reportId, {
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