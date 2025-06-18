<script lang="ts">
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';
	import { Control, Description, Fieldset, FieldErrors, Legend } from 'formsnap';
	import { schema } from './schema.js';

	let { data } = $props();

	const form = superForm(data.form, {
		validators: zodClient(schema)
	});

	const { form: formData, enhance, capture, restore } = form;

	export const snapshot = { capture, restore };
</script>

<h1>Login</h1>
<form method="POST" use:enhance>
	<Fieldset {form} name="username">
		<Legend>Username</Legend>
		<Control>
			{#snippet children({ props })}
				<input {...props} type="text" bind:value={$formData.username} />
			{/snippet}
		</Control>
		<Description>Enter your username.</Description>
		<FieldErrors />
	</Fieldset>
	<Fieldset {form} name="password">
		<Legend>Password</Legend>
		<Control>
			{#snippet children({ props })}
				<input {...props} type="password" bind:value={$formData.password} />
			{/snippet}
		</Control>
		<Description>Must be at least 8 characters.</Description>
		<FieldErrors />
	</Fieldset>
	<button>Login</button>
</form>

<style>
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

	form {
		width: 50%;
	}

	button {
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

	input {
		margin-top: 0.5em;
		padding: 0.25em;
		width: 100%;
	}
</style>
