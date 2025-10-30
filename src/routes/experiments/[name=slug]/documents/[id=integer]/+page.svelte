<script lang="ts">
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';
	import { schema } from '$lib/schemas/annotation.js';
	import CloseIcon from '~icons/fe/close';
	import Annotation from '$lib/components/Annotation.svelte';

	const { data } = $props();

	const form = superForm(data.form, {
		validators: zodClient(schema),
		taintedMessage: true,
		dataType: 'json'
	});

	const { capture, restore, submitting } = form;

	export const snapshot = { capture, restore };

	const content = $derived(data.document.content);

	let dialog = $state<HTMLDialogElement>();

	$effect(() => {
		if ($submitting) {
			dialog?.close();
		}
	});
</script>

<Annotation
	{form}
	{content}
	documentId={data.document.id}
	labels={data.experiment.labels}
	history={data.experiment.history}
	onsubmit={() => dialog?.showModal()}
	disabled={false}
/>

<dialog bind:this={dialog}>
	<form method="POST">
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
	p {
		/* ensure consistent and readable document */
		width: 66ch;
		padding-block: 0.25em;
		text-align: justify;
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
