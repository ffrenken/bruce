<script lang="ts">
	import type { SvelteHTMLElements } from 'svelte/elements';
	import { Tween } from 'svelte/motion';

	type Props = {
		value: number;
		max: number;
	} & SvelteHTMLElements['div'];

	const { value, max, class: className, ...rest }: Props = $props();

	const progress = new Tween(0);

	$effect(() => {
		progress.target = (value / max) * 100;
	});
</script>

<div
	role="progressbar"
	aria-label="Progress"
	aria-valuenow={Math.round(progress.current)}
	class={className}
	{...rest}
>
	<div class="value" style:width={`${progress.current}%`}></div>
</div>

<style>
	[role='progressbar'] {
		position: relative;
		width: 100%;
		height: 1.5em;
		border: 1px solid #ccc;
	}

	[role='progressbar']:before {
		position: absolute;
		top: -1px;
		left: 0;
		right: 0;
		color: #333;
		content: attr(aria-valuenow) '%';
		text-align: center;
	}

	[role='progressbar'] .value {
		height: 100%;
		background-color: #9e829c;
	}
</style>
