<!-- Interactive Research Component -->
<script lang="ts">
	import { onMount } from 'svelte';

	export let reportId: string;
	export let topic: string;
	export let description: string;
	export let breadth: number = 4;
	export let depth: number = 2;

	let step = 0; // 0: initial, 1: answering questions, 2: research in progress
	let followUpQuestions: string[] = [];
	let answers: string[] = [];
	let isLoading = false;
	let error: string | null = null;

	// Function to generate follow-up questions
	async function generateQuestions() {
		isLoading = true;
		error = null;

		try {
			const response = await fetch(`/api/research/questions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					topic,
					description,
					breadth,
					depth
				})
			});

			if (!response.ok) {
				throw new Error('Failed to generate questions');
			}

			const data = await response.json();
			followUpQuestions = data.questions;
			answers = Array(followUpQuestions.length).fill('');
			step = 1; // Move to answering questions
		} catch (err) {
			console.error('Error generating questions:', err);
			error = err instanceof Error ? err.message : 'Failed to generate questions';
		} finally {
			isLoading = false;
		}
	}

	// Function to start research with answers
	async function startResearch() {
		isLoading = true;
		error = null;

		try {
			const response = await fetch(`/api/research/start`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					reportId,
					topic,
					description,
					breadth,
					depth,
					followUpQuestions,
					answers
				})
			});

			if (!response.ok) {
				throw new Error('Failed to start research');
			}

			step = 2; // Move to research in progress

			// Reload the page after a short delay to show updated status
			setTimeout(() => {
				window.location.reload();
			}, 1000);
		} catch (err) {
			console.error('Error starting research:', err);
			error = err instanceof Error ? err.message : 'Failed to start research';
		} finally {
			isLoading = false;
		}
	}

	// Start generating questions when the component mounts
	onMount(() => {
		generateQuestions();
	});
</script>

<div class="space-y-6">
	{#if error}
		<div class="rounded-lg bg-red-50 p-4 text-red-800">
			<p>{error}</p>
			<button
				class="mt-2 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
				on:click={() => (step === 0 ? generateQuestions() : startResearch())}
			>
				Retry
			</button>
		</div>
	{/if}

	{#if step === 0}
		<div class="rounded-lg bg-blue-50 p-6">
			<h2 class="mb-4 text-xl font-semibold">Preparing Research</h2>
			{#if isLoading}
				<div class="flex items-center space-x-3">
					<div class="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600"></div>
					<p>Generating follow-up questions...</p>
				</div>
			{:else}
				<p>Failed to generate questions. Please try again.</p>
				<button
					class="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					on:click={generateQuestions}
				>
					Retry
				</button>
			{/if}
		</div>
	{:else if step === 1}
		<div class="rounded-lg bg-blue-50 p-6">
			<h2 class="mb-4 text-xl font-semibold">Follow-up Questions</h2>
			<p class="mb-4 text-gray-700">
				To better understand your research needs, please answer these follow-up questions:
			</p>

			<div class="space-y-4">
				{#each followUpQuestions as question, i}
					<div class="rounded-lg bg-white p-4 shadow">
						<label for="answer-{i}" class="mb-2 block font-medium">
							{question}
						</label>
						<textarea
							id="answer-{i}"
							bind:value={answers[i]}
							rows="3"
							class="w-full rounded border border-gray-300 p-2"
							placeholder="Your answer..."
						></textarea>
					</div>
				{/each}
			</div>

			<div class="mt-6 flex justify-end">
				<button
					class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
					on:click={startResearch}
					disabled={isLoading || answers.some((a) => !a.trim())}
				>
					{isLoading ? 'Starting Research...' : 'Submit Answers & Start Research'}
				</button>
			</div>
		</div>
	{:else if step === 2}
		<div class="rounded-lg bg-blue-50 p-6 text-center">
			<h2 class="mb-4 text-xl font-semibold">Research in Progress</h2>
			<div
				class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"
			></div>
			<p>Your research is now in progress. This page will update automatically.</p>
		</div>
	{/if}
</div>
