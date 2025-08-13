<script lang="ts">
	import ScrollArea from '$lib/components/ScrollArea.svelte';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { arrayProxy, superForm } from 'sveltekit-superforms/client';
	import { schema } from './schema.js';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import { onMount } from 'svelte';
	import CloseIcon from '~icons/fe/close';
	import { getPalette } from '$lib/utils.js';

	const { data } = $props();

	const form = superForm(data.form, {
		validators: zodClient(schema),
		taintedMessage: true,
		dataType: 'json'
	});

	const { form: formData, enhance, capture, restore, submitting } = form;

	export const snapshot = { capture, restore };

	onMount(() => performance.mark('start'));

	// shorthand for accessing form data
	const { values: segmentation } = arrayProxy(form, 'segmentation');
	const { values: edits } = arrayProxy(form, 'edits');
	const { values: rts } = arrayProxy(form, 'rts');

	const content = $derived(data.document.content);

	const palette = $derived(
		getPalette(
			content.map((value) => value.metadata),
			{ seed: data.document.id }
		)
	);

	type Entry = { index: number; rt: number; isBoundary: boolean };
	let history: Entry[] = [];

	function handleInput(e: KeyboardEvent) {
		if ($segmentation.length >= content.length) {
			return;
		}
		switch (e.key) {
			case ' ':
			case 'Enter': {
				e.preventDefault();
				// record response times between actions;
				// ignores the interval between last input
				// and page reload, which resets the clock
				const { startTime } = performance.mark('end');
				const rt = performance.measure('rt', 'start', 'end');
				performance.mark('start', { startTime });
				$rts = [...$rts, rt.duration];
				const isBoundary = e.key === 'Enter';
				$segmentation = [...$segmentation, isBoundary];
				history = []; // truncate previous actions
				break;
			}
			case 'z': {
				const limit = data.experiment.history ?? Infinity;
				if (!e.ctrlKey || history.length >= limit) {
					return;
				}
				e.preventDefault();
				const index = $segmentation.length;
				const isBoundary = $segmentation[index - 1];
				$segmentation = $segmentation.slice(0, -1);
				const rt = $rts[index - 1];
				$rts = $rts.slice(0, -1);
				if (isBoundary === undefined || rt === undefined) {
					return;
				}
				const edit = { index, rt, isBoundary };
				$edits = [...$edits, { type: 'undo', ...edit }];
				history.push({ index, rt, isBoundary });
				break;
			}
			case 'y': {
				if (!e.ctrlKey) {
					return;
				}
				e.preventDefault();
				const entry = history.pop();
				if (entry === undefined) {
					return;
				}
				const { index, rt, isBoundary } = entry;
				$rts = [...$rts, rt];
				$segmentation = [...$segmentation, isBoundary];
				const edit = { index, rt, isBoundary };
				$edits = [...$edits, { type: 'redo', ...edit }];
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

	let dialog = $state<HTMLDialogElement>();

	$effect(() => {
		if ($submitting) {
			dialog?.close();
		}
	});
</script>

<svelte:window onkeydown={handleInput} />

<form id="annotation" method="POST" use:enhance>
	<!-- no native <progress> due to browser inconsistencies -->
	{#if $segmentation.length < content.length}
		<ProgressBar value={$segmentation.length} max={content.length} />
	{/if}
	<!-- disable scrollbar during segmentation -->
	<ScrollArea disabled={$segmentation.length >= content.length}>
		{#if $segmentation.length >= content.length}
			<label for="label">Label</label>
			<label for="segment">Segment</label>
		{/if}
		{#each segments as segment, i (segment)}
			{#if $segmentation.length >= content.length}
				<input
					id="label"
					type="text"
					placeholder={i === 0 ? 'Enter segment label...' : '>'}
					bind:value={$formData.labels[i]}
				/>
			{/if}
			<p
				class="segment"
				style:border-left={$segmentation.length >= content.length ? '0.25em solid #9e829c' : null}
			>
				{#each segment as span (span.id)}
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
		<div id="category">
			<span>This document is a</span><input
				type="text"
				aria-label="category"
				placeholder="Enter category..."
				bind:value={$formData.category}
			/>
			<span>.</span>
		</div>
		<button type="button" onclick={() => dialog?.showModal()}>Submit</button>
	{/if}
	<div class="controls">
		<dl>
			<dt><kbd>Space</kbd></dt>
			<dd>Continue</dd>
			<dt><kbd>Enter</kbd></dt>
			<dd>Break</dd>
			<dt><kbd>Ctrl</kbd>+<kbd>Z</kbd>/<kbd>Y</kbd></dt>
			<dd>Undo/Redo</dd>
		</dl>
	</div>
</form>

<dialog bind:this={dialog}>
	<form method="POST" use:enhance>
		<h3>Confirmation</h3>
		<button aria-label="close" formmethod="DIALOG"><CloseIcon /></button>
		<p>
			You are about to submit your answers. Would you like to continue with the <em>next</em>
			document, or <em>stop</em> annotating and go to the survey?
		</p>
		<button form="annotation" formaction="?/next">Next</button>
		<button form="annotation" formaction="?/stop">Stop</button>
	</form>
</dialog>

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
		padding: 0.25em;
		border: 0;
		outline: 0;
	}

	p {
		/* ensure consistent and readable document */
		width: 66ch;
		padding-block: 0.25em;
		text-align: justify;
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

	dialog {
		place-self: center;
		padding: 1em;
		border: 1px solid #291528;
		box-shadow:
			0 1px 3px 0 #9e829c,
			0 1px 2px -1px #9e829c;
	}

	h3 {
		display: inline-block;
	}

	button[aria-label='close'] {
		float: right;
		border: 0;
		padding: 0.25em;
		background-color: transparent;

		&:hover {
			cursor: pointer;
			background-color: #f0eff4;
		}
	}
</style>
