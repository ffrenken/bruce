<script lang="ts">
	import type { Action } from 'svelte/action';
	import type { SvelteHTMLElements } from 'svelte/elements';

	type Props = {
		disabled: boolean;
	} & SvelteHTMLElements['div'];

	const { disabled, children, ...rest }: Props = $props();

	const scrolldown: Action<HTMLDivElement> = (node) => {
		const observer = new MutationObserver(() => {
			node.scroll({
				top: node.scrollHeight,
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
		height: 9em;
		box-shadow:
			0 1px 3px 0 #9e829c,
			0 1px 2px -1px #9e829c;
		background-color: #f9f9f9;
	}
</style>
