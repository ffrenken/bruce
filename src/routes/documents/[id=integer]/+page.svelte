<script lang="ts">
	import ScrollArea from '$lib/components/ScrollArea.svelte';

	const { data } = $props();

	const content = data.document.content;

	// true if span at index marked as boundary
	let input = $state<boolean[]>([]);

	function handleInput(e: KeyboardEvent) {
		if (input.length >= content.length) {
			return;
		}
		switch (e.key) {
			case ' ':
			case 'Enter':
				e.preventDefault();
				input.push(e.key === 'Enter');
				break;
		}
	}

	type Span = { id: string; text: string; metadata: string };
	const segments = $derived.by(() => {
		return input.reduce(
			(result, isBoundary, i) => {
				if (isBoundary) {
					result.push([content[i]]);
				} else {
					result[result.length - 1].push(content[i]);
				}
				return result;
			},
			[[]] as Span[][]
		);
	});
</script>

<svelte:window onkeydown={handleInput} />

<!-- disable scrollbar during segmentation -->
<ScrollArea disabled={input.length >= content.length}>
	{#each segments as segment, i}
		<p>
			{#each segment as span (span.id)}
				<span>{span.text}</span>
			{/each}
			<!-- current span after last segment if not finished -->
			{#if i === segments.length - 1 && input.length < content.length}
				<span class="caret">{content[input.length].text}</span>
			{/if}
		</p>
	{/each}
</ScrollArea>

<style>
	p {
		/* ensure consistent and readable document */
		width: 66ch;
		padding-block: 0.25em;
		padding-inline: 0.75em;
		text-align: justify;
		transition: background-color 0.2s ease-in-out;

		&:hover {
			background-color: #f0eff4;
		}
	}

	/*
	no divider after the last span in
	each segment and before the caret
	*/
	p span:not(:last-child):not(:has(+ .caret)) {
		border-inline-start-width: 0px;
		border-inline-end-width: 0.1em;
		border-block: 0;
		border-color: #9e829c;
		border-style: dashed;
	}

	p span:not(:first-child) {
		padding-left: 0.5ch;
	}

	p span:not(:last-child) {
		padding-right: 0.5ch;
	}

	.caret {
		position: relative;
		font-weight: bold;

		&::before {
			position: absolute;
			content: '|';
			font-weight: 100;
			top: -0.25em;
			left: -0.25em;
			animation: blink 1s step-end infinite;
		}
	}

	@keyframes blink {
		from,
		to {
			color: transparent;
		}

		50% {
			color: black;
		}
	}
</style>
