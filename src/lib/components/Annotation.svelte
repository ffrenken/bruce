<script lang="ts">
	import { arrayProxy, type SuperForm } from 'sveltekit-superforms/client';
	import ProgressBar from './ProgressBar.svelte';
	import ScrollArea from './ScrollArea.svelte';
	import { getPalette } from '$lib/utils';
	import { onMount } from 'svelte';
	import type { Schema, BoundaryType } from '$lib/schemas/annotation';

	type Props = {
		form: SuperForm<Schema, unknown>;
		content: { id: string; text: string; metadata: string }[];
		documentId: number;
		labels: boolean;
		history: number | null;
		onsubmit: () => void;
		disabled: boolean;
	};

	const {
		form,
		content,
		documentId,
		labels,
		history,
		onsubmit: onSubmit,
		disabled
	}: Props = $props();

	const { form: formData, enhance } = form;

	const palette = $derived(
		getPalette(
			content.map((value) => value.metadata),
			{ seed: documentId }
		)
	);

	onMount(() => performance.mark('start'));

	// shorthand for accessing form data
	const { values: segmentation } = arrayProxy(form, 'segmentation');
	const { values: edits } = arrayProxy(form, 'edits');
	const { values: rts } = arrayProxy(form, 'rts');

	type Entry = { index: number; rt: number; boundary: BoundaryType };
	let editHistory: Entry[] = [];
	function handleInput(e: KeyboardEvent) {
		if (disabled || $segmentation.length > content.length) {
			return;
		}
		switch (e.key) {
			case ' ':
			case 'Enter': {
				e.preventDefault();
				// only allow undo/redo if segmentation is incomplete
				if ($segmentation.length >= content.length) {
					return;
				}
				// record response times between actions;
				// ignores the interval between last input
				// and page reload, which resets the clock
				const { startTime } = performance.mark('end');
				const rt = performance.measure('rt', 'start', 'end');
				performance.mark('start', { startTime });
				$rts = [...$rts, rt.duration];
				const boundary = e.key === 'Enter' ? (e.shiftKey ? 'soft' : 'hard') : null;
				$segmentation = [...$segmentation, boundary];
				editHistory = []; // truncate previous actions
				break;
			}
			case 'z': {
				const limit = history ?? Infinity;
				if (!e.ctrlKey || editHistory.length >= limit) {
					return;
				}
				e.preventDefault();
				const index = $segmentation.length;
				const boundary = $segmentation[index - 1];
				$segmentation = $segmentation.slice(0, -1);
				const rt = $rts[index - 1];
				$rts = $rts.slice(0, -1);
				if (boundary === undefined || rt === undefined) {
					return;
				}
				const edit = { index, rt, boundary };
				$edits = [...$edits, { type: 'undo', ...edit }];
				editHistory.push({ index, rt, boundary });
				break;
			}
			case 'y': {
				if (!e.ctrlKey) {
					return;
				}
				e.preventDefault();
				const entry = editHistory.pop();
				if (entry === undefined) {
					return;
				}
				const { index, rt, boundary } = entry;
				$rts = [...$rts, rt];
				$segmentation = [...$segmentation, boundary];
				const edit = { index, rt, boundary };
				$edits = [...$edits, { type: 'redo', ...edit }];
				break;
			}
		}
	}

	type Span = { id: string; text: string; metadata: string };
	type Segment = { spans: Span[]; type: 'hard' | 'soft' };

	const segments = $derived.by(() => {
		return $segmentation.reduce((segments, boundary, i) => {
			if (boundary === null) {
				segments[segments.length - 1].spans.push(content[i]);
			} else {
				segments.push({ spans: [content[i]], type: boundary });
			}
			return segments;
		}, [] as Segment[]);
	});
</script>

<svelte:window onkeydown={handleInput} />

<form id="annotation" method="POST" use:enhance>
	<!-- no native <progress> due to browser inconsistencies -->
	{#if $segmentation.length <= content.length}
		<!-- subtract 1 from both to start at 0% despite initial default segment -->
		<ProgressBar value={$segmentation.length - 1} max={content.length - 1} />
	{/if}
	<!-- disable scrollbar during segmentation -->
	<ScrollArea {labels} disabled={$segmentation.length < content.length}>
		{#if labels && $segmentation.length >= content.length}
			<label for="label">Label</label>
			<label for="segment">Segment</label>
		{/if}
		{#each segments as segment, i (i)}
			{#if labels && $segmentation.length >= content.length}
				<input
					id="label"
					type="text"
					placeholder={i === 0 ? 'Enter segment label...' : '>'}
					bind:value={$formData.labels[i]}
				/>
			{/if}

			<p
				class={`segment ${segment.type}`}
				style:border-left={labels && $segmentation.length >= content.length
					? '0.25em solid #9e829c'
					: null}
			>
				{#each segment.spans as span (span.id)}
					<span style:color={palette.get(span.metadata)}>{span.text}</span>
				{/each}
				<!-- current span after last segment if not finished -->
				{#if i === segments.length - 1 && $segmentation.length < content.length}
					<span style:color={palette.get(content[$segmentation.length].metadata)} class="caret"
						>{content[$segmentation.length].text}</span
					>
				{/if}
			</p>
		{/each}
	</ScrollArea>
	{#if $segmentation.length >= content.length}
		{#if labels}
			<div id="category">
				<span>This document is a</span><input
					type="text"
					aria-label="category"
					placeholder="Enter category..."
					bind:value={$formData.category}
				/>
				<span>.</span>
			</div>
		{/if}
		<button type="button" onclick={onSubmit}>Submit</button>
	{/if}
	<div class="controls">
		<dl>
			<dt><kbd>Space</kbd></dt>
			<dd>Continue</dd>
			<dt>(<kbd>Shift</kbd>+)<kbd>Enter</kbd></dt>
			<dd>(Soft) Break</dd>
			<dt><kbd>Ctrl</kbd>+<kbd>Z</kbd>/<kbd>Y</kbd></dt>
			<dd>Undo/Redo</dd>
		</dl>
	</div>
</form>

<style>
	form#annotation {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	label[for='label'] {
		position: sticky;
		top: 0;
		padding: 0.25em;
		color: #3a3e3b;
		background-color: #f0eff4;
		font-weight: bold;
	}

	label[for='segment'] {
		position: sticky;
		top: 0;
		padding-inline: 0.75em;
		padding-block: 0.25em;
		color: #3a3e3b;
		background-color: #f0eff4;
		border-left: 0.25em solid #9e829c;
		font-weight: bold;
	}

	input[type='text'] {
		border: 0;
		outline: 0;
	}

	p {
		/* ensure consistent and readable document */
		width: 66ch;
		text-align: justify;
	}

	p:not(:first-of-type).hard {
		padding-top: 1em;
		text-indent: 1em;
	}

	.segment {
		padding-inline: 0.75em;
		transition: background-color 0.2s ease-in-out;

		&:hover {
			background-color: #f4eef2;
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

	p:not(:first-of-type).hard .caret {
		&::before {
			left: -1.25em;
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

	#category {
		margin-inline: auto;
	}

	#category input {
		border-bottom: 1px solid #9e829c;
		margin-left: 1ch;
		text-align: center;
	}

	.controls {
		margin-inline: auto;
		padding: 1em;
		border: 1px solid #ccc;
	}

	dl {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5em;
	}

	dd {
		margin-left: auto;
		font-size: 90%;
	}

	kbd {
		background-color: #f0eff4;
		padding: 0.5em;
		font-family: monospace;
	}

	button {
		padding-inline: 1rem;
		padding-block: 0.5rem;
		border: 0;
		margin-inline: auto;
		color: #151515ff;
		background-color: #f0eff4;

		&:hover {
			cursor: pointer;
			filter: brightness(0.9);
		}
	}
</style>
