<script lang="ts">
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';
	import { Control, Description, Field, FieldErrors, Label } from 'formsnap';
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
	<Field {form} name="username">
		<Control>
			{#snippet children({ props })}
				<Label>Username</Label>
				<input {...props} type="text" bind:value={$formData.username} />
			{/snippet}
		</Control>
		<Description>Enter your username.</Description>
		<FieldErrors />
	</Field>
	<Field {form} name="password">
		<Control>
			{#snippet children({ props })}
				<Label>Password</Label>
				<input {...props} type="password" bind:value={$formData.password} />
			{/snippet}
		</Control>
		<Description>Must be at least 8 characters.</Description>
		<FieldErrors />
	</Field>
	<button>Login</button>
</form>
