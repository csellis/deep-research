<!-- Report detail page -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { marked } from 'marked';
	import type { PageData } from './$types';

	export let data: PageData;

	// Function to render markdown to HTML
	function renderMarkdown(content: string) {
		return marked.parse(content);
	}

	// Interactive research state
	let researchStep = 0; // 0: initial, 1: answering questions, 2: research in progress
	let breadth = 4;
	let depth = 2;
	let followUpQuestions: string[] = [];
	let answers: string[] = [];
	let isLoadingQuestions = false;

	// Function to start the interactive research process
	async function startInteractiveResearch() {
		if (!data.report) return;

		researchStep = 0;
		isLoadingQuestions = true;

		try {
			// Fetch follow-up questions
			const response = await fetch(
				`/api/reports/${data.report.id}/questions?breadth=${breadth}&depth=${depth}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						topic: data.report.topic,
						description: data.report.description
					})
				}
			);

			if (!response.ok) {
				throw new Error('Failed to fetch follow-up questions');
			}

			const result = await response.json();
			followUpQuestions = result.questions;
			answers = Array(followUpQuestions.length).fill('');

			researchStep = 1; // Move to answering questions step
		} catch (error) {
			console.error('Error fetching follow-up questions:', error);
			alert('Failed to fetch follow-up questions. Please try again.');
		} finally {
			isLoadingQuestions = false;
		}
	}

	// Function to submit answers and start research
	async function submitAnswersAndStartResearch() {
		if (!data.report) return;

		try {
			const response = await fetch(`/api/reports/${data.report.id}/research`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					breadth,
					depth,
					followUpQuestions,
					answers
				})
			});

			if (!response.ok) {
				throw new Error('Failed to start research');
			}

			researchStep = 2; // Move to research in progress step

			// Reload the page data to show updated status
			setTimeout(() => {
				window.location.reload();
			}, 1000);
		} catch (error) {
			console.error('Error starting research:', error);
			alert('Failed to start research. Please try again.');
		}
	}
</script>

<div class="container mx-auto max-w-screen-lg px-4 py-8">
	<div class="mb-8">
		<a href="/" class="text-blue-600 hover:text-blue-800">← Back to Reports</a>
	</div>

	{#if data.report}
		<div class="rounded-lg bg-white p-6 shadow-lg">
			<h1 class="mb-4 text-3xl font-bold">{data.report.topic}</h1>
			<p class="mb-6 text-gray-600">{data.report.description}</p>

			<div class="mb-6 flex items-center justify-between">
				<span
					class="inline-flex items-center rounded-full px-3 py-1 text-sm
          {data.report.status === 'completed'
						? 'bg-green-100 text-green-800'
						: data.report.status === 'pending'
							? 'bg-yellow-100 text-yellow-800'
							: data.report.status === 'error'
								? 'bg-red-100 text-red-800'
								: 'bg-gray-100 text-gray-800'}"
				>
					{data.report.status}
				</span>

				{#if data.report.status === 'pending' && !data.isProcessing && researchStep === 0}
					<div class="flex items-center space-x-4">
						<button
							on:click={startInteractiveResearch}
							class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
							disabled={isLoadingQuestions}
						>
							{isLoadingQuestions ? 'Loading...' : 'Start Interactive Research'}
						</button>
						<form method="POST" action="?/startResearch" use:enhance>
							<button
								type="submit"
								class="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
							>
								Quick Start Research
							</button>
						</form>
					</div>
				{:else if data.isProcessing || researchStep === 2}
					<span class="text-blue-600">Research in progress...</span>
				{/if}
			</div>

			{#if researchStep === 0 && data.report.status === 'pending' && !data.isProcessing}
				<div class="mb-6 rounded-lg bg-blue-50 p-4">
					<h2 class="mb-2 text-xl font-semibold">Research Parameters</h2>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label for="breadth" class="mb-1 block text-sm font-medium text-gray-700">
								Breadth (1-5): {breadth}
							</label>
							<input
								id="breadth"
								type="range"
								min="1"
								max="5"
								bind:value={breadth}
								class="w-full"
							/>
							<p class="mt-1 text-xs text-gray-500">
								Higher breadth means more diverse research queries (more comprehensive but slower)
							</p>
						</div>
						<div>
							<label for="depth" class="mb-1 block text-sm font-medium text-gray-700">
								Depth (1-3): {depth}
							</label>
							<input id="depth" type="range" min="1" max="3" bind:value={depth} class="w-full" />
							<p class="mt-1 text-xs text-gray-500">
								Higher depth means more follow-up research (more thorough but slower)
							</p>
						</div>
					</div>
				</div>
			{:else if researchStep === 1}
				<div class="mb-6 rounded-lg bg-blue-50 p-4">
					<h2 class="mb-4 text-xl font-semibold">Follow-up Questions</h2>
					<p class="mb-4 text-sm text-gray-600">
						Please answer these follow-up questions to help guide the research:
					</p>

					<div class="space-y-4">
						{#each followUpQuestions as question, i}
							<div class="rounded-lg bg-white p-4 shadow">
								<label for="answer-{i}" class="mb-2 block font-medium">
									{i + 1}. {question}
								</label>
								<textarea
									id="answer-{i}"
									bind:value={answers[i]}
									rows="2"
									class="w-full rounded border border-gray-300 p-2"
									placeholder="Your answer..."
								></textarea>
							</div>
						{/each}
					</div>

					<div class="mt-6 flex justify-end">
						<button
							on:click={submitAnswersAndStartResearch}
							class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
							disabled={answers.some((a) => !a.trim())}
						>
							Submit Answers & Start Research
						</button>
					</div>
				</div>
			{/if}

			{#if data.report.content}
				<div class="prose prose-lg max-w-screen-lg mx-auto">
					<!-- 
						Content is sanitized server-side before being stored in the database.
						The content is generated by our own system and not user-provided.
						We render the markdown content to HTML
					-->
					{@html renderMarkdown(data.report.content)}
				</div>
			{:else if data.report.status === 'pending' && (data.isProcessing || researchStep === 2)}
				<div class="py-8 text-center">
					<div
						class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"
					></div>
					<p class="text-gray-600">Research in progress...</p>
				</div>
			{:else if data.report.status === 'pending' && researchStep === 0 && !isLoadingQuestions}
				<div class="py-8 text-center">
					<p class="text-gray-600">
						Click "Start Interactive Research" to begin the research process.
					</p>
				</div>
			{:else}
				<p class="text-gray-600">No content available.</p>
			{/if}

			<div class="mt-6 text-sm text-gray-500">
				Created: {new Date(data.report.created_at).toLocaleString()}
				<br />
				Last updated: {new Date(data.report.updated_at).toLocaleString()}
			</div>
		</div>
	{:else}
		<div class="rounded-lg bg-red-50 p-4 text-red-800">Report not found.</div>
	{/if}
</div>
