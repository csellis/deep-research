import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { reports } from '$lib/server/db/schema';
import { startResearchJob } from '$lib/server/jobs';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { topic, description, breadth = 4, depth = 2 } = body;

    // Validate required fields
    if (!topic || !description) {
      return json({ error: 'Topic and description are required' }, { status: 400 });
    }

    // Create the report
    const result = await db.insert(reports).values({
      topic,
      description,
      status: 'pending',
      metadata: JSON.stringify({ breadth, depth }),
      created_at: new Date(),
      updated_at: new Date()
    }).returning();

    const report = result[0];

    // Start the research job
    setTimeout(() => {
      startResearchJob(report.id.toString(), { breadth, depth });
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