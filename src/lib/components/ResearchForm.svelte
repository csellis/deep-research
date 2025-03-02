<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import InitialInput from './InitialInput.svelte';
	import FollowUpQuestions from './FollowUpQuestions.svelte';
	import ReviewInputs from './ReviewInputs.svelte';

	const dispatch = createEventDispatcher();

	// Form state
	let currentStep = 1;
	let isLoading = false;
	let error: string | null = null;

	// Form data
	let formData = {
		topic: '',
		description: '',
		breadth: 4,
		depth: 2,
		followUpQuestions: [] as string[],
		answers: [] as string[]
	};

	// Step validation
	$: isStepValid = {
		1: formData.topic && formData.description,
		2:
			formData.answers.length === formData.followUpQuestions.length &&
			formData.answers.every((answer) => answer.trim().length > 0),
		3: true // Review step is always valid
	};

	// Handle initial input submission
	async function handleInitialSubmit() {
		if (!isStepValid[1]) return;

		isLoading = true;
		error = null;

		try {
			const response = await fetch('/api/research/prepare', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					topic: formData.topic,
					description: formData.description,
					breadth: formData.breadth,
					depth: formData.depth
				})
			});

			if (!response.ok) throw new Error('Failed to generate questions');

			const data = await response.json();
			formData.followUpQuestions = data.questions;
			formData.answers = Array(data.questions.length).fill('');
			currentStep = 2;
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isLoading = false;
		}
	}

	// Handle final submission
	async function handleFinalSubmit() {
		isLoading = true;
		error = null;

		try {
			const response = await fetch('/api/research/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (!response.ok) throw new Error('Failed to start research');

			const data = await response.json();
			dispatch('complete', data);
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isLoading = false;
		}
	}

	// Navigation
	function goToStep(step: number) {
		if (step < currentStep) {
			currentStep = step;
		}
	}
</script>

# Deep Research Implementation Plan

<div class="space-y-8">
	<!-- Progress indicator -->
	<div class="flex justify-between">
		{#each Array(3) as _, i}
			<button
				class="flex items-center {currentStep === i + 1
					? 'text-blue-600'
					: currentStep > i + 1
						? 'text-green-600'
						: 'text-gray-400'}"
				on:click={() => goToStep(i + 1)}
				disabled={i + 1 > currentStep}
			>
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full border-2
          {currentStep === i + 1
						? 'border-blue-600'
						: currentStep > i + 1
							? 'border-green-600'
							: 'border-gray-400'}"
				>
					{i + 1}
				</div>
				<span class="ml-2">
					{i === 0 ? 'Initial Input' : i === 1 ? 'Follow-up Questions' : 'Review'}
				</span>
			</button>
		{/each}
	</div>

	<!-- Error display -->
	{#if error}
		<div class="rounded-lg bg-red-50 p-4 text-red-800">
			{error}
		</div>
	{/if}

	<!-- Form steps -->
	<div class="rounded-lg bg-white p-6 shadow-lg">
		{#if currentStep === 1}
			<InitialInput
				bind:topic={formData.topic}
				bind:description={formData.description}
				bind:breadth={formData.breadth}
				bind:depth={formData.depth}
				{isLoading}
				on:submit={handleInitialSubmit}
			/>
		{:else if currentStep === 2}
			<FollowUpQuestions
				questions={formData.followUpQuestions}
				bind:answers={formData.answers}
				topic={formData.topic}
				description={formData.description}
				on:back={() => (currentStep = 1)}
				on:next={() => (currentStep = 3)}
			/>
		{:else}
			<ReviewInputs
				{formData}
				{isLoading}
				on:back={() => (currentStep = 2)}
				on:submit={handleFinalSubmit}
			/>
		{/if}
	</div>
</div>
