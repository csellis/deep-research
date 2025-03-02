<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let topic: string = '';
	export let description: string = '';
	export let breadth: number = 4;
	export let depth: number = 2;
	export let isLoading: boolean = false;

	const dispatch = createEventDispatcher();

	function handleSubmit() {
		dispatch('submit');
	}
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
	<div>
		<label for="topic" class="mb-2 block text-sm font-medium text-gray-700"> Research Topic </label>
		<input
			type="text"
			id="topic"
			bind:value={topic}
			class="w-full rounded-md border border-gray-300 px-3 py-2"
			required
			disabled={isLoading}
		/>
	</div>

	<div>
		<label for="description" class="mb-2 block text-sm font-medium text-gray-700">
			Description
		</label>
		<textarea
			id="description"
			bind:value={description}
			rows="3"
			class="w-full rounded-md border border-gray-300 px-3 py-2"
			required
			disabled={isLoading}
		></textarea>
	</div>

	<div class="rounded-lg bg-blue-50 p-4">
		<h3 class="mb-2 text-lg font-semibold">Research Parameters</h3>
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
					disabled={isLoading}
				/>
				<p class="mt-1 text-xs text-gray-500">Higher breadth means more diverse research queries</p>
			</div>
			<div>
				<label for="depth" class="mb-1 block text-sm font-medium text-gray-700">
					Depth (1-3): {depth}
				</label>
				<input
					id="depth"
					type="range"
					min="1"
					max="3"
					bind:value={depth}
					class="w-full"
					disabled={isLoading}
				/>
				<p class="mt-1 text-xs text-gray-500">Higher depth means more follow-up research</p>
			</div>
		</div>
	</div>

	<div class="flex justify-end">
		<button
			type="submit"
			class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
			disabled={isLoading || !topic || !description}
		>
			{isLoading ? 'Generating Questions...' : 'Next: Follow-up Questions'}
		</button>
	</div>
</form>
