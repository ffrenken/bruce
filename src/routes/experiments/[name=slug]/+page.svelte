<script lang="ts">
	const { data } = $props();
</script>

<div>
	<h2>Instructions</h2>
	<p>{data.experiment.instructions}</p>
	<a href={`/experiments/${data.experiment.name}/tutorial`}>Tutorial</a>
	<a href={`/experiments/${data.experiment.name}/documents/${data.document.id}`}>Begin</a>
</div>

<style>
	div {
		width: 50%;
	}

	p {
		text-align: justify;
		margin-block: 0.5em;
		padding: 1em;
		background-color: #f9f9f9;
		border-left: 0.25em solid #9e829c;
		color: #333;
	}

	a {
		display: inline-block;
		padding-inline: 1em;
		padding-block: 0.5em;
		text-decoration: none;
		color: #151515ff;
		background-color: #f0eff4;

		&:hover {
			cursor: pointer;
			filter: brightness(0.9);
		}
	}
</style>
