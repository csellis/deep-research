import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { reports } from '$lib/server/db/schema';

export async function POST({ request }) {
	const { topic, description, breadth, depth } = await request.json();

	// Create new report
	const [report] = await db
		.insert(reports)
		.values({
			topic,
			description,
			status: 'pending',
			metadata: JSON.stringify({
				breadth,
				depth,
				created: new Date().toISOString()
			}),
			created_at: new Date(),
			updated_at: new Date()
		})
		.returning();

	return json(report);
}
