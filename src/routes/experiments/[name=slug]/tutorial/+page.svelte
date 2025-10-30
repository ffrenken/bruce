<script lang="ts">
	import Annotation from '$lib/components/Annotation.svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import CloseIcon from '~icons/fe/close';
	import { schema } from '$lib/schemas/annotation';
	import { goto } from '$app/navigation';

	let { data } = $props();

	const form = superForm(data.form, {
		validators: zodClient(schema),
		dataType: 'json'
	});

	const { form: formData, capture, restore } = form;

	const content = data.document.content;

	let step = $state('a');

	$effect(() => {
		if ($formData.segmentation[$formData.segmentation.length - 1]) {
			step = 'b';
		} else if (data.experiment.labels && $formData.segmentation.length >= content.length) {
			step = 'c';
		}
	});

	export const snapshot = {
		capture: () => {
			return { step, form: capture() };
		},
		restore: ({ step: prevStep, form }) => {
			step = prevStep;
			restore(form);
		}
	};

	let dialog = $state<HTMLDialogElement>();

	let open = $derived('abc'.includes(step));

	$effect(() => {
		if (open) {
			dialog?.showModal();
		} else {
			dialog?.close();
		}
	});
</script>

<Annotation
	{form}
	{content}
	documentId={data.document.id}
	labels={data.experiment.labels}
	history={null}
	onsubmit={() => goto(`/experiments/${data.experiment.name}`)}
	disabled={open}
></Annotation>

<dialog bind:this={dialog}>
	<h3>Tutorial</h3>
	<!-- tabindex prevents accidentally pressing close button due to autofocus -->
	<button aria-label="close" tabindex="-1" onclick={() => (open = false)}><CloseIcon /></button>
	{#if step === 'a'}
		<p>
			Press <kbd>Space</kbd> to show the next part of the document. If you think that it starts a
			new segment, hit <kbd>Enter</kbd> to break. Otherwise continue.
		</p>
	{:else if step === 'b'}
		<p>
			Each segment is represented as one paragraph. You can undo/redo your decisions by pressing <kbd
				>Ctrl</kbd
			>+<kbd>Z</kbd>/<kbd>Y</kbd> respectively.
		</p>
	{:else if step === 'c'}
		<p>
			Now enter descriptive labels for each segment you identified, and use them to categorize the
			whole document. You may leave inputs blank.
		</p>
	{/if}
</dialog>

<style>
	p {
		/* ensure consistent and readable document */
		width: 66ch;
		padding-block: 0.25em;
		text-align: justify;
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
