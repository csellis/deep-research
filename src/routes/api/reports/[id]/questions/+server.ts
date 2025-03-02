import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { reports } from '$lib/server/schema';
import { generateFeedback } from '$lib/deep-research/feedback';

export const POST: RequestHandler = async ({ params, request, url }) => {
  try {
    const reportId = params.id;

    // Get breadth and depth from query parameters
    const breadth = parseInt(url.searchParams.get('breadth') || '4');
    const depth = parseInt(url.searchParams.get('depth') || '2');

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
    const { topic, description } = body;

    // Generate follow-up questions
    const followUpQuestions = await generateFeedback({
      query: topic || report.topic
    });

    // Update the report with the research parameters
    await db
      .update(reports)
      .set({
        metadata: JSON.stringify({ breadth, depth }),
        updated_at: new Date()
      })
      .where(eq(reports.id, reportId));

    return json({
      questions: followUpQuestions,
      breadth,
      depth
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    return json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}; 