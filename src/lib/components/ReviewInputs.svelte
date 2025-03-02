<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let formData: {
		topic: string;
		description: string;
		breadth: number;
		depth: number;
		followUpQuestions: string[];
		answers: string[];
	};
	export let isLoading: boolean = false;

	const dispatch = createEventDispatcher();

	function handleBack() {
		dispatch('back');
	}

	function handleSubmit() {
		dispatch('submit');
	}
</script>

<div class="space-y-6">
	<h2 class="text-2xl font-semibold">Review Your Research Request</h2>

	<!-- Initial query -->
	<div class="rounded-lg bg-gray-50 p-4">
		<h3 class="mb-2 text-lg font-semibold">Initial Query</h3>
		<div class="space-y-4">
			<div>
				<h4 class="font-medium">Topic</h4>
				<p>{formData.topic}</p>
			</div>
			<div>
				<h4 class="font-medium">Description</h4>
				<p>{formData.description}</p>
			</div>
		</div>
	</div>

	<!-- Research parameters -->
	<div class="rounded-lg bg-blue-50 p-4">
		<h3 class="mb-2 text-lg font-semibold">Research Parameters</h3>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<h4 class="font-medium">Breadth: {formData.breadth}</h4>
				<p class="text-sm text-gray-600">Level of diversity in research queries</p>
			</div>
			<div>
				<h4 class="font-medium">Depth: {formData.depth}</h4>
				<p class="text-sm text-gray-600">Level of follow-up research</p>
			</div>
		</div>
	</div>

	<!-- Follow-up questions and answers -->
	<div class="rounded-lg bg-gray-50 p-4">
		<h3 class="mb-4 text-lg font-semibold">Follow-up Questions and Answers</h3>
		<div class="space-y-4">
			{#each formData.followUpQuestions as question, i}
				<div class="rounded-lg bg-white p-4 shadow">
					<h4 class="font-medium">{question}</h4>
					<p class="mt-2 whitespace-pre-wrap text-gray-600">{formData.answers[i]}</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- Navigation buttons -->
	<div class="flex justify-between">
		<button
			type="button"
			class="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
			on:click={handleBack}
			disabled={isLoading}
		>
			Back to Questions
		</button>
		<button
			type="button"
			class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
			on:click={handleSubmit}
			disabled={isLoading}
		>
			{isLoading ? 'Starting Research...' : 'Start Research'}
		</button>
	</div>
</div>
