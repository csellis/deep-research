import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateFeedback } from '$lib/deep-research/feedback';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { topic, description } = body;

		if (!topic || !description) {
			return json({ error: 'Topic and description are required' }, { status: 400 });
		}

		// Generate follow-up questions based on the topic and description
		const questions = await generateFeedback({
			query: `${topic}\n\nContext: ${description}`
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
