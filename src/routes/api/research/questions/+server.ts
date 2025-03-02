import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateFeedback } from '$lib/deep-research/feedback';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { topic, description, breadth, depth } = body;

    if (!topic) {
      return json({ error: 'Topic is required' }, { status: 400 });
    }

    // Generate follow-up questions based on the topic
    const questions = await generateFeedback({
      query: topic
    });

    return json({
      questions,
      breadth,
      depth
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    return json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}; 