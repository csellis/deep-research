<!-- Main landing page -->
<script lang="ts">
	import type { PageData } from './$types';
	import ResearchForm from '$lib/components/ResearchForm.svelte';
	import { goto } from '$app/navigation';

	export let data: PageData;

	async function handleResearchComplete(event: CustomEvent) {
		const { report } = event.detail;
		if (report?.id) {
			await goto(`/reports/${report.id}`);
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="mb-8 text-4xl font-bold">Deep Research Reports</h1>

	<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
		<!-- Create new report form -->
		<div class="rounded-lg bg-white p-6 shadow-lg">
			<h2 class="mb-4 text-2xl font-semibold">Create New Report</h2>
			<ResearchForm on:complete={handleResearchComplete} />
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
