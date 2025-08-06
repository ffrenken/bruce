<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { schema } from './schema.js';
	import { Control, Description, FieldErrors, Fieldset, Label, Legend } from 'formsnap';
	import LikertScale from '$lib/components/LikertScale.svelte';

	let { data } = $props();

	const form = superForm(data.form, {
		validators: zodClient(schema),
		taintedMessage: true,
		dataType: 'json'
	});

	const { form: formData, enhance, capture, restore, errors } = form;

	export const snapshot = { capture, restore };
</script>

<h1>Survey</h1>
<form method="POST" use:enhance>
	<Fieldset {form} name="age">
		<Legend>Age</Legend>
		<Control>
			{#snippet children({ props })}
				<input
					{...props}
					type="number"
					placeholder="e.g. 23"
					min="0"
					max="100"
					bind:value={$formData.age}
				/>
			{/snippet}
		</Control>
		<Description>Given in years.</Description>
		<FieldErrors />
	</Fieldset>
	<Fieldset {form} name="gender">
		<Legend>Gender (optional)</Legend>
		<Control>
			{#snippet children({ props })}
				<input {...props} type="text" placeholder="e.g. Female" bind:value={$formData.gender} />
			{/snippet}
		</Control>
		<Description>Label you identify with the most.</Description>
		<FieldErrors />
	</Fieldset>
	<Fieldset {form} name="languages">
		<Legend>Languages</Legend>
		<Control>
			{#snippet children({ props })}
				<input
					{...props}
					type="text"
					placeholder="e.g. Hindi, German, English"
					bind:value={$formData.languages}
				/>
			{/snippet}
		</Control>
		<Description>Listed in order of dominance.</Description>
		<FieldErrors />
	</Fieldset>
	<Fieldset {form} name="background">
		<Legend>Cultural Background</Legend>
		<Control>
			{#snippet children({ props })}
				<input
					{...props}
					type="text"
					placeholder="e.g. Indian raised in Germany"
					bind:value={$formData.background}
				/>
			{/snippet}
		</Control>
		<Description>Based on upbringing, not nationality.</Description>
		<FieldErrors />
	</Fieldset>
	<br />
	<LikertScale
		{form}
		name="intuitiveness"
		statement="The experiment felt intuitive."
		bind:group={$formData.intuitiveness}
	/>
	<LikertScale
		{form}
		name="ease"
		statement="The experiment was easy."
		bind:group={$formData.ease}
	/>
	<Fieldset {form} name="feedback">
		<Legend>Further Feedback</Legend>
		<Control>
			{#snippet children({ props })}
				<textarea {...props} placeholder="Enter text here..." bind:value={$formData.feedback}
				></textarea>
			{/snippet}
		</Control>
		<Description>Share suggestions or describe any problems you encountered.</Description>
		<FieldErrors />
	</Fieldset>
	<br />
	<Fieldset {form} name="valid" id="valid">
		<Legend>Did you engage with the experiment earnestly?</Legend>
		<div class="group">
			{#each [true, false] as option (option)}
				<Control>
					{#snippet children({ props })}
						<input type="radio" {...props} bind:group={$formData.valid} value={option} />
						<Label>{option ? 'yes' : 'no'}</Label>
					{/snippet}
				</Control>
			{/each}
		</div>
		<FieldErrors />
	</Fieldset>
	{#if $errors._errors !== undefined}
		<div data-fs-error>
			{$errors._errors}
		</div>
	{/if}
	<button>Submit</button>
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

	input {
		margin-top: 0.5em;
		padding: 0.25em;
		width: 100%;
	}

	textarea {
		resize: none;
		padding: 0.25em;
		width: 100%;
	}

	.group {
		display: flex;
		align-items: center;
		gap: 1ch;
	}

	input[type='radio'] {
		width: auto;
	}

	button {
		padding-inline: 1rem;
		padding-block: 0.5rem;
		border: 0;
		margin-block: 1em;
		color: #151515ff;
		background-color: #f0eff4;

		&:hover {
			cursor: pointer;
			filter: brightness(0.9);
		}
	}
</style>
