<!-- Report detail page -->
<script lang="ts">
	import { marked } from 'marked';
	import type { PageData } from './$types';

	export let data: PageData;

	// Function to render markdown to HTML
	function renderMarkdown(content: string) {
		return marked.parse(content);
	}

	// Function to format date
	function formatDate(date: string | Date) {
		if (date instanceof Date) {
			return date.toLocaleString();
		}
		return new Date(date).toLocaleString();
	}

	// Group sources by domain
	function groupSourcesByDomain(sources: any[]) {
		const groups = new Map();

		for (const source of sources) {
			try {
				const url = new URL(source.url);
				const domain = url.hostname;

				if (!groups.has(domain)) {
					groups.set(domain, []);
				}

				groups.get(domain).push(source);
			} catch (e) {
				// If URL parsing fails, group under "Other"
				const domain = 'Other';
				if (!groups.has(domain)) {
					groups.set(domain, []);
				}
				groups.get(domain).push(source);
			}
		}

		return groups;
	}

	$: sourceGroups = data.sources ? groupSourcesByDomain(data.sources) : new Map();
</script>

<div class="container mx-auto max-w-screen-lg px-4 py-8">
	<div class="mb-8">
		<a href="/" class="text-blue-600 hover:text-blue-800">← Back to Reports</a>
	</div>

	{#if data.report}
		<div class="rounded-lg bg-white p-6 shadow-lg">
			<h1 class="mb-4 text-3xl font-bold">
				{data.report.topic}
			</h1>
			<p class="mb-6 text-gray-600">
				Generated: {formatDate(data.report.created_at)}
				<br />
				Updated: {formatDate(data.report.updated_at)}
				<br />
				{data.report.description}
			</p>

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

				{#if data.isProcessing}
					<span class="text-blue-600">Research in progress...</span>
				{/if}
			</div>

			{#if data.report.content}
				<div class="prose prose-lg mx-auto max-w-screen-lg">
					<!-- 
						Content is sanitized server-side before being stored in the database.
						The content is generated by our own system and not user-provided.
						We render the markdown content to HTML
					-->
					{@html renderMarkdown(data.report.content)}
				</div>

				<!-- Sources Section -->
				{#if data.sources && data.sources.length > 0}
					<div class="mt-8 border-t pt-8">
						<h2 class="mb-6 text-2xl font-bold">Research Sources</h2>

						{#each [...sourceGroups.entries()] as [domain, sources]}
							<div class="mb-6">
								<h3 class="mb-3 text-lg font-semibold text-gray-700">{domain}</h3>
								<div class="space-y-4">
									{#each sources as source}
										<div class="rounded-lg border border-gray-200 p-4">
											<h4 class="mb-2 font-medium">
												<a
													href={source.url}
													target="_blank"
													rel="noopener noreferrer"
													class="text-blue-600 hover:text-blue-800"
												>
													{source.title || 'Untitled'}
												</a>
											</h4>
											<p class="text-gray-600">{source.snippet}</p>
											<div class="mt-2 text-sm text-gray-500">
												Added: {formatDate(source.created_at)}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}

				{#if data.isProcessing}
					<div class="py-8 text-center">
						<div
							class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"
						></div>
						<p class="text-gray-600">Research in progress...</p>
					</div>
				{/if}
			{:else if data.report.status === 'pending'}
				<div class="py-8 text-center">
					<p class="text-gray-600">Research will begin shortly...</p>
				</div>
			{:else}
				<p class="text-gray-600">No content available.</p>
			{/if}

			<div class="mt-6 text-sm text-gray-500">
				Created: {formatDate(data.report.created_at)}
				<br />
				Last updated: {formatDate(data.report.updated_at)}
			</div>
		</div>
	{:else}
		<div class="rounded-lg bg-red-50 p-4 text-red-800">Report not found.</div>
	{/if}
</div>
