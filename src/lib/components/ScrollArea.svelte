<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { SvelteHTMLElements } from 'svelte/elements';
	import { Tween } from 'svelte/motion';

	type Props = {
		labels: boolean;
		disabled: boolean;
	} & SvelteHTMLElements['div'];

	const { disabled, labels, children, ...rest }: Props = $props();

	let height = $state<number>();
	let animate = $state(false);

	const scrolldown: Attachment = (node) => {
		let nParagraphs = 0;
		// matches duration of height transition
		const scroll = new Tween(0, { duration: 300 });
		const mo = new MutationObserver(() => {
			const paragraphs = node.querySelectorAll('p');
			if (paragraphs.length == 0) {
				return;
			}
			// only animate height for new paragraphs
			// (results in annoying jitter otherwise)
			animate = nParagraphs < paragraphs.length;
			nParagraphs = paragraphs.length;
			height = paragraphs[paragraphs.length - 1].scrollHeight;
			if (paragraphs.length > 1) {
				height += paragraphs[paragraphs.length - 2].scrollHeight;
			}
			scroll.target = node.scrollHeight;
		});
		$effect(() => {
			node.scrollTop = scroll.current;
		});
		mo.observe(node, { childList: true, subtree: true });
		return () => mo.disconnect();
	};
</script>

<!-- https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/document_role#best_practices -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	id="scrollarea"
	class:animate
	style:overflow-y={disabled ? 'hidden' : 'scroll'}
	style:grid-template-columns={labels && !disabled ? '1fr auto' : 'auto'}
	style:height={disabled ? `${height}px` : '25vh'}
	role="document"
	aria-label="Document"
	tabindex="0"
	{@attach scrolldown}
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
		box-shadow:
			0 1px 3px 0 #9e829c,
			0 1px 2px -1px #9e829c;
		background-color: #f9f9f9;
	}

	.animate {
		transition: height 300ms ease;
	}
</style>
