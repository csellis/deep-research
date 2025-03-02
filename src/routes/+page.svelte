<!-- Main landing page -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;

	// Default values for research parameters
	let breadth = 4;
	let depth = 2;
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="mb-8 text-4xl font-bold">Deep Research Reports</h1>

	<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
		<!-- Create new report form -->
		<div class="rounded-lg bg-white p-6 shadow-lg">
			<h2 class="mb-4 text-2xl font-semibold">Create New Report</h2>
			<form method="POST" use:enhance>
				<div class="mb-4">
					<label for="topic" class="mb-2 block text-sm font-medium text-gray-700"
						>Research Topic</label
					>
					<input
						type="text"
						id="topic"
						name="topic"
						class="w-full rounded-md border border-gray-300 px-3 py-2"
						required
					/>
				</div>
				<div class="mb-4">
					<label for="description" class="mb-2 block text-sm font-medium text-gray-700"
						>Description</label
					>
					<textarea
						id="description"
						name="description"
						rows="3"
						class="w-full rounded-md border border-gray-300 px-3 py-2"
						required
					></textarea>
				</div>

				<div class="mb-6 rounded-lg bg-blue-50 p-4">
					<h3 class="mb-2 text-lg font-semibold">Research Parameters</h3>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label for="breadth" class="mb-1 block text-sm font-medium text-gray-700">
								Breadth (1-5): {breadth}
							</label>
							<input
								id="breadth"
								name="breadth"
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
							<input
								id="depth"
								name="depth"
								type="range"
								min="1"
								max="3"
								bind:value={depth}
								class="w-full"
							/>
							<p class="mt-1 text-xs text-gray-500">
								Higher depth means more follow-up research (more thorough but slower)
							</p>
						</div>
					</div>
				</div>

				<button
					type="submit"
					class="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
				>
					Start Research
				</button>
			</form>
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
