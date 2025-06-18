<script lang="ts">
	import '../app.css';
	import LoginIcon from '~icons/fe/login';
	import LogoutIcon from '~icons/fe/logout';
	import MailIcon from '~icons/fe/mail';

	let { data, children } = $props();
</script>

<div id="container">
	<header>
		<h2><a href="/">BRUCE</a></h2>

		{#if data.user === null}
			<a href="/login" id="login"><span>Login</span><LoginIcon /></a>
		{:else}
			<form method="POST" action="/logout">
				<button id="logout"><span>Logout <em>{data.user.username}</em></span><LogoutIcon /></button>
			</form>
		{/if}
	</header>
	<main>
		{@render children()}
	</main>
	<footer>
		<address>
			<a href="mailto:florian.frenken@rwth-aachen.de"
				><MailIcon /><span>florian.frenken@rwth-aachen.de</span></a
			>
		</address>
	</footer>
</div>

<style>
	:global(body) {
		background-color: #f0eff4;
	}

	#container {
		display: grid;
		grid-template-columns: 1;
		grid-template-rows: auto 1fr auto;
		min-height: 100dvh;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1em;
		background: #291528;
	}

	h2 {
		font-size: 180%;
	}

	#login,
	#logout {
		padding-inline: 1em;
		padding-block: 0.5em;
		background: #151515ff;
		border: 0;

		&:hover {
			cursor: pointer;
			filter: brightness(1.7);
		}
	}

	a,
	button {
		display: inline-flex;
		align-items: center;
		gap: 1ch;
		color: #f0eff4;
		text-decoration: none;
	}

	main {
		margin-inline: auto;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background: #fff;
		padding-inline: 5em;
		width: 70%;
	}

	footer {
		padding: 1em;
		background: #3a3e3b;
	}
</style>
