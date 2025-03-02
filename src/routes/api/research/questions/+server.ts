import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateFeedback } from '$lib/deep-research/feedback';

export async function POST({ request }) {
	const { topic } = await request.json();

	try {
		const questions = await generateFeedback({
			query: topic
		});

		return json({ questions });
	} catch (error: any) {
		return json({ error: error.message || 'Failed to generate questions' }, { status: 500 });
	}
}
