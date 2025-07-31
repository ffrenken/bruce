<script lang="ts">
	import ScrollArea from '$lib/components/ScrollArea.svelte';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { arrayProxy, superForm } from 'sveltekit-superforms/client';
	import { schema } from './schema.js';
	import ProgressBar from '$lib/components/ProgressBar.svelte';

	const { data } = $props();

	const form = superForm(data.form, {
		validators: zodClient(schema),
		taintedMessage: true,
		dataType: 'json'
	});

	const { enhance, capture, restore } = form;

	export const snapshot = { capture, restore };

	// shorthand for accessing form data
	const { values: segmentation } = arrayProxy(form, 'segmentation');
	const content = data.document.content;

	function handleInput(e: KeyboardEvent) {
		if ($segmentation.length >= content.length) {
			return;
		}
		switch (e.key) {
			case ' ':
			case 'Enter': {
				e.preventDefault();
				const isBoundary = e.key === 'Enter';
				$segmentation = [...$segmentation, isBoundary];
				break;
			}
		}
	}

	type Span = { id: string; text: string; metadata: string };
	const segments = $derived.by(() => {
		return $segmentation.reduce(
			(segments, isBoundary, i) => {
				if (isBoundary) {
					segments.push([content[i]]);
				} else {
					segments[segments.length - 1].push(content[i]);
				}
				return segments;
			},
			[[]] as Span[][]
		);
	});
</script>

<svelte:window onkeydown={handleInput} />

<form method="POST" use:enhance>
	<!-- no native <progress> due to browser inconsistencies -->
	<ProgressBar value={$segmentation.length} max={content.length} />
	<!-- disable scrollbar during segmentation -->
	<ScrollArea disabled={$segmentation.length >= content.length}>
		{#each segments as segment, i}
			<p>
				{#each segment as span (span.id)}
					<span>{span.text}</span>
				{/each}
				<!-- current span after last segment if not finished -->
				{#if i === segments.length - 1 && $segmentation.length < content.length}
					<span class="caret">{content[$segmentation.length].text}</span>
				{/if}
			</p>
		{/each}
	</ScrollArea>
	{#if $segmentation.length >= content.length}
		<button>Submit</button>
	{/if}
</form>

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

	button {
		padding-inline: 1rem;
		padding-block: 0.5rem;
		border: 0;
		margin-top: 0.5em;
		color: #151515ff;
		background-color: #f0eff4;

		&:hover {
			cursor: pointer;
			filter: brightness(0.9);
		}
	}
</style>
