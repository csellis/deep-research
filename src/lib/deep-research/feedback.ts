import { generateObject } from 'ai';
import { z } from 'zod';
import { o3MiniModel } from './ai/providers';
import { systemPrompt } from './prompt';
import { OutputManager } from './output-manager';

// Initialize output manager for coordinated console/progress output
const output = new OutputManager();

// Replace console.log with output.log
function log(...args: any[]) {
	output.log(...args);
}

/**
 * Generate follow-up questions for a research query
 */
export async function generateFeedback({
	query,
	numQuestions = 3
}: {
	query: string;
	numQuestions?: number;
}): Promise<string[]> {
	log(`Generating follow-up questions for: "${query}"`);

	try {
		const res = await generateObject({
			model: o3MiniModel,
			system: systemPrompt(),
			prompt: `Given the following research topic, generate ${numQuestions} follow-up questions to better understand the user's research needs. These questions should help clarify the scope, focus, and specific aspects of the research topic that would be most valuable to explore.

Research Topic: ${query}

The questions should be clear, specific, and designed to elicit informative responses that will guide the research process. Avoid yes/no questions and instead ask open-ended questions that encourage detailed answers.`,
			schema: z.object({
				questions: z
					.array(z.string())
					.describe(
						`List of ${numQuestions} follow-up questions to better understand the research needs`
					)
			})
		});

		log(`Generated ${res.object.questions.length} follow-up questions`);
		res.object.questions.forEach((q, i) => log(`  Question ${i + 1}: ${q}`));

		return res.object.questions;
	} catch (error: any) {
		log(`Error generating follow-up questions: ${error.message || error}`);
		console.error(error);

		// Return some default questions if there's an error
		return [
			"Could you provide more specific details about what aspects of this topic you're most interested in?",
			'Are there any particular use cases or scenarios you want the research to focus on?',
			"What's your current level of knowledge on this topic, and what gaps are you trying to fill?"
		];
	}
}
