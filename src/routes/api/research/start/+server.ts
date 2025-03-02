import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { reports } from '$lib/server/schema';
import { startResearchWithAnswers } from '$lib/server/jobs';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      topic,
      description,
      breadth,
      depth,
      followUpQuestions,
      answers
    } = body;

    // Validate required fields
    if (!topic || !description) {
      return json({ error: 'Topic and description are required' }, { status: 400 });
    }

    if (!followUpQuestions || !answers || followUpQuestions.length !== answers.length) {
      return json({ error: 'Invalid questions or answers' }, { status: 400 });
    }

    // Create the report
    const result = await db.insert(reports).values({
      topic,
      description,
      status: 'pending',
      metadata: JSON.stringify({
        breadth,
        depth,
        followUpQuestions,
        answers
      }),
      created_at: new Date(),
      updated_at: new Date()
    }).returning();

    const report = result[0];

    // Start the research job with the answers
    setTimeout(() => {
      startResearchWithAnswers(report.id, {
        breadth,
        depth,
        followUpQuestions,
        answers
      });
    }, 100);

    return json({ success: true, report });
  } catch (error) {
    console.error('Error starting research:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Failed to start research' },
      { status: 500 }
    );
  }
}; 