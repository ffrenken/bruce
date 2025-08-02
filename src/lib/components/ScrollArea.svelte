<script lang="ts">
	import type { Action } from 'svelte/action';
	import type { SvelteHTMLElements } from 'svelte/elements';

	type Props = {
		disabled: boolean;
	} & SvelteHTMLElements['div'];

	const { disabled, children, ...rest }: Props = $props();

	const scrolldown: Action<HTMLDivElement> = (node) => {
		const observer = new MutationObserver(() => {
			const position = disabled ? 0 : node.scrollHeight;
			node.scroll({
				top: position,
				behavior: 'smooth'
			});
		});
		observer.observe(node, { childList: true, subtree: true });
		return {
			destroy() {
				observer.disconnect();
			}
		};
	};
</script>

<!-- https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/document_role#best_practices -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	id="scrollarea"
	style={`overflow-y: ${disabled ? 'scroll' : 'hidden'};`}
	style:grid-template-columns={disabled ? '1fr auto' : 'auto'}
	role="document"
	aria-label="Document"
	tabindex="0"
	use:scrolldown
	{...rest}
>
	{@render children?.()}
</div>

<style>
	#scrollarea {
		/* based on line-height */
		display: grid;
		grid-auto-rows: min-content;
		align-items: baseline;
		height: 9em;
		box-shadow:
			0 1px 3px 0 #9e829c,
			0 1px 2px -1px #9e829c;
		background-color: #f9f9f9;
	}
</style>
