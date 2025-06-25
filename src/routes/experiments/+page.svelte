<script lang="ts">
	import { Control, Description, FieldErrors, Fieldset, Legend } from 'formsnap';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { filesProxy, superForm } from 'sveltekit-superforms/client';
	import PlusIcon from '~icons/fe/plus';
	import TrashIcon from '~icons/fe/trash';
	import CloseIcon from '~icons/fe/close';
	import { creation } from './schema.js';

	const { data } = $props();

	const form = superForm(data.form, {
		validators: zodClient(creation)
	});

	const { form: formData, enhance, capture, restore, errors } = form;
	export const snapshot = { capture, restore };

	const files = filesProxy(form, 'documents');

	let dialog = $state<HTMLDialogElement>();
</script>

<div id="container">
	<h1>Experiments</h1>

	{#if data.experiments.length > 0}
		<ul>
			{#each data.experiments as experiment}
				<li>
					<a href={`/experiments/${experiment.name}`}><span>{experiment.name}</span></a>
					<form method="POST" action="?/delete">
						{#if data.user}
							<input type="hidden" name="name" value={experiment.name} />
							<button type="submit" aria-label="delete">
								<TrashIcon />
							</button>
						{/if}
					</form>
				</li>
			{/each}
		</ul>
	{/if}
	{#if data.user}
		<button aria-label="create" onclick={() => dialog?.showModal()}><PlusIcon /></button>
	{/if}
</div>

<dialog bind:this={dialog}>
	<form method="POST" action="?/create" enctype="multipart/form-data" use:enhance>
		<h3>Create Experiment</h3>
		<button aria-label="close" formmethod="DIALOG"><CloseIcon /></button>
		<Fieldset {form} name="name">
			<Legend>Name</Legend>
			<Control>
				{#snippet children({ props })}
					<input {...props} type="text" bind:value={$formData.name} />
				{/snippet}
			</Control>
			<Description>Enter a unique name.</Description>
			<FieldErrors />
		</Fieldset>
		<Fieldset {form} name="documents">
			<Legend>Documents</Legend>
			<Control>
				{#snippet children({ props })}
					<input {...props} type="file" multiple accept=".tsv" bind:files={$files} />
				{/snippet}
			</Control>
			<Description>UTF-8 .tsv files with id/text/metadata.</Description>
			<FieldErrors />
		</Fieldset>
		{#if $errors._errors !== undefined}
			<div class="form-level-error" data-fs-error>{$errors._errors}</div>
		{/if}
		<button type="submit">Create</button>
	</form>
</dialog>

<style>
	#container {
		width: 50%;
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		margin-block: 0.5em;
	}

	li {
		display: inline-flex;
		width: 100%;
		padding: 0.5em;
		background-color: #f0eff4;
		box-shadow:
			0 1px 3px 0 #9e829c,
			0 1px 2px -1px #9e829c;
	}

	li a {
		width: 100%;
		padding-inline: 0.75em;
		padding-block: 0.25em;
		border: 0;
		text-decoration: none;
		color: #3a3e3b;
		outline: 1px solid #291528;
		background-color: #fff;

		&:hover {
			cursor: pointer;
			text-decoration: underline;
		}
	}

	button[aria-label='delete'] {
		padding: 0.4em;
		background-color: #9e829c;
		border: 0;
		outline: 1px solid #291528;
		color: #fff;

		&:hover {
			cursor: pointer;
			filter: brightness(0.9);
		}
	}

	button[aria-label='create'] {
		border: 0;
		background-color: #9e829c;
		color: #fff;
		padding: 0.25em;

		box-shadow:
			0 1px 3px 0 #9e829c,
			0 1px 2px -1px #9e829c;

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

	:global([data-fs-fieldset]) {
		border: 0;
		margin-bottom: 0.5em;
	}

	:global([data-fs-error]) {
		color: #cc0000;
	}

	:global([data-fs-description]) {
		font-style: italic;
	}

	dialog input {
		margin-top: 0.5em;
		padding: 0.25em;
		width: 100%;
	}

	dialog input[type='file'] {
		padding: 0;
		font-style: italic;
		background-color: #9e829c;
		color: #fff;

		&:hover {
			cursor: pointer;
		}
	}

	dialog input[type='file']::file-selector-button {
		border: 0;
		padding-block: 0.5em;
		padding-inline: 0.75em;
		background-color: #f0eff4;
	}

	.form-level-error {
		margin-bottom: 0.5em;
	}

	dialog button[type='submit'] {
		padding-block: 0.5em;
		padding-inline: 0.75em;
		border: 0;

		color: #f0eff4;
		background-color: #151515ff;

		&:hover {
			cursor: pointer;
			filter: brightness(1.7);
		}
	}
</style>
