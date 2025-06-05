<script lang="ts">
	let { data, children } = $props();
</script>

<h2><a href="/">BRUCE</a></h2>
{#if data.user === null}
	<a href="/login">Login</a>
{:else}
	<form method="POST" action="/logout">
		<button>Logout {data.user.username}</button>
	</form>
{/if}
{@render children()}
