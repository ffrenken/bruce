<script lang="ts">
	import { Control, FieldErrors, Fieldset, Label, Legend } from 'formsnap';

	let { form, name, statement, group = $bindable() } = $props();

	const likert = ['strongly agree', 'agree', 'neutral', 'disagree', 'strongly disagree', 'N/A'];
</script>

<Fieldset {form} {name}>
	<Legend class="statement">{statement}</Legend>
	<div class="group">
		{#each likert as label (label)}
			<Control>
				{#snippet children({ props })}
					<input type="radio" {...props} bind:group value={label} />
					<Label>{label}</Label>
				{/snippet}
			</Control>
		{/each}
	</div>
	<FieldErrors />
</Fieldset>

<style>
	.group {
		display: flex;
		align-items: center;
		justify-content: safe center;
		flex-wrap: wrap;
		white-space: nowrap;
		gap: 1ch;
	}

	input[type='radio'] {
		width: auto;
	}
</style>
