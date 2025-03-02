<!-- Main landing page -->
<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	export let data: PageData;

	let loading = false;
	let showQuickStart = false;
	let topic = '';
	let description = '';
	let breadth = 4;
	let depth = 2;
	let step = 1;
	let questions: string[] = [];
	let answers: string[] = [];
	let report: any = null;

	async function handleSubmit(event: Event) {
		event.preventDefault();
		loading = true;

		try {
			// Create initial report
			const response = await fetch('/api/reports', {
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
				throw new Error('Failed to create report');
			}

			report = await response.json();

			if (showQuickStart) {
				// Start research immediately with default answers
				await fetch(`/api/research/start/${report.id}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						answers: [
							'Yes, temporal analysis would be valuable. Historical trends and future projections are important.',
							'The market dynamics differ significantly between urban Charlotte and rural Feering.',
							'Local economic indicators and population growth patterns are key factors.'
						]
					})
				});

				// Redirect to report page
				await goto(`/reports/${report.id}`);
			} else {
				// Generate follow-up questions
				const questionsResponse = await fetch('/api/research/questions', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ topic })
				});

				if (!questionsResponse.ok) {
					throw new Error('Failed to generate questions');
				}

				const data = await questionsResponse.json();
				questions = data.questions;
				answers = new Array(questions.length).fill('');
				step = 2;
			}
		} catch (error) {
			console.error('Error:', error);
			alert('An error occurred while creating the report');
		} finally {
			loading = false;
		}
	}

	async function handleAnswersSubmit(event: Event) {
		event.preventDefault();
		loading = true;

		try {
			// Start research with user's answers
			await fetch(`/api/research/start/${report.id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ answers })
			});

			// Redirect to report page
			await goto(`/reports/${report.id}`);
		} catch (error) {
			console.error('Error:', error);
			alert('An error occurred while starting research');
		} finally {
			loading = false;
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="mb-8 text-4xl font-bold">Deep Research Reports</h1>

	<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
		<!-- Create new report form -->
		<div class="rounded-lg bg-white p-6 shadow-lg">
			<h2 class="mb-4 text-2xl font-semibold">Create New Report</h2>

			{#if step === 1}
				<form on:submit={handleSubmit} class="space-y-4">
					<div>
						<label for="topic" class="block text-sm font-medium text-gray-700">Research Topic</label
						>
						<input
							type="text"
							id="topic"
							bind:value={topic}
							required
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							placeholder="Enter your research topic"
							disabled={loading}
						/>
					</div>

					<div>
						<label for="description" class="block text-sm font-medium text-gray-700"
							>Description</label
						>
						<textarea
							id="description"
							bind:value={description}
							required
							rows="3"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							placeholder="Provide additional context or requirements"
							disabled={loading}
						></textarea>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="breadth" class="block text-sm font-medium text-gray-700"
								>Breadth (1-5)</label
							>
							<input
								type="range"
								id="breadth"
								bind:value={breadth}
								min="1"
								max="5"
								class="mt-1 block w-full"
								disabled={loading}
							/>
							<span class="text-sm text-gray-500">Current: {breadth}</span>
						</div>

						<div>
							<label for="depth" class="block text-sm font-medium text-gray-700">Depth (1-3)</label>
							<input
								type="range"
								id="depth"
								bind:value={depth}
								min="1"
								max="3"
								class="mt-1 block w-full"
								disabled={loading}
							/>
							<span class="text-sm text-gray-500">Current: {depth}</span>
						</div>
					</div>

					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id="quickStart"
							bind:checked={showQuickStart}
							disabled={loading}
						/>
						<label for="quickStart" class="text-sm text-gray-700">
							Quick Start (Auto-answer questions for testing)
						</label>
					</div>

					<button
						type="submit"
						class="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
						disabled={loading}
					>
						{#if loading}
							<span class="flex items-center justify-center gap-2">
								<svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
										fill="none"
									/>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
								</svg>
								{showQuickStart ? 'Starting Research...' : 'Creating Report...'}
							</span>
						{:else}
							Continue
						{/if}
					</button>
				</form>
			{:else if step === 2}
				<form on:submit={handleAnswersSubmit} class="space-y-6">
					<div class="space-y-4">
						{#each questions as question, i}
							<div>
								<label for="answer{i}" class="block text-sm font-medium text-gray-700"
									>{question}</label
								>
								<textarea
									id="answer{i}"
									bind:value={answers[i]}
									required
									rows="3"
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
									placeholder="Your answer..."
									disabled={loading}
								></textarea>
							</div>
						{/each}
					</div>

					<div class="flex gap-4">
						<button
							type="button"
							class="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
							on:click={() => (step = 1)}
							disabled={loading}
						>
							Back
						</button>
						<button
							type="submit"
							class="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
							disabled={loading}
						>
							{#if loading}
								<span class="flex items-center justify-center gap-2">
									<svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24">
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
											fill="none"
										/>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									Starting Research...
								</span>
							{:else}
								Start Research
							{/if}
						</button>
					</div>
				</form>
			{/if}
		</div>

		<!-- Reports list -->
		<div class="rounded-lg bg-white p-6 shadow-lg">
			<h2 class="mb-4 text-2xl font-semibold">Recent Reports</h2>
			{#if data.reports && data.reports.length > 0}
				<div class="space-y-4">
					{#each data.reports as report (report.id)}
						<a
							href="/reports/{report.id}"
							class="block rounded-md border border-gray-200 p-4 hover:border-blue-500"
						>
							<h3 class="font-semibold">{report.topic}</h3>
							<p class="text-sm text-gray-600">{report.description}</p>
							<div class="mt-2 text-xs text-gray-500">
								Created: {new Date(report.created_at).toLocaleString()}
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<p class="text-gray-600">No reports yet. Create your first one!</p>
			{/if}
		</div>
	</div>
</div>
