<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let questions: string[] = [];
	export let answers: string[] = [];
	export let topic: string = '';
	export let description: string = '';

	const dispatch = createEventDispatcher();

	$: isValid =
		answers.length === questions.length && answers.every((answer) => answer.trim().length > 0);

	function handleBack() {
		dispatch('back');
	}

	function handleNext() {
		if (isValid) {
			dispatch('next');
		}
	}
</script>

<div class="space-y-6">
	<!-- Initial query preview -->
	<div class="rounded-lg bg-gray-50 p-4">
		<h3 class="mb-2 text-lg font-semibold">Initial Query</h3>
		<p class="font-medium">{topic}</p>
		<p class="mt-2 text-gray-600">{description}</p>
	</div>

	<!-- Follow-up questions -->
	<div>
		<h3 class="mb-4 text-lg font-semibold">Follow-up Questions</h3>
		<p class="mb-4 text-gray-600">
			Please answer these questions to help us better understand your research needs:
		</p>

		<div class="space-y-4">
			{#each questions as question, i}
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
	</div>

	<!-- Navigation buttons -->
	<div class="flex justify-between">
		<button
			type="button"
			class="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
			on:click={handleBack}
		>
			Back to Initial Input
		</button>
		<button
			type="button"
			class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
			disabled={!isValid}
			on:click={handleNext}
		>
			Next: Review
		</button>
	</div>
</div>
