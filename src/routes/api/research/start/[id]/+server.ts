import { json } from '@sveltejs/kit';
import { startResearchWithAnswers } from '$lib/server/jobs';

export async function POST({ request, params }) {
  const { answers } = await request.json();
  const reportId = params.id;

  try {
    await startResearchWithAnswers({
      reportId,
      answers
    });

    return json({ success: true });
  } catch (error: any) {
    return json(
      { error: error.message || 'Failed to start research' },
      { status: 500 }
    );
  }
} 