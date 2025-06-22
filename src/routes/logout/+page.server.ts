import { deleteSessionTokenCookie } from '$lib/server/auth';
import { invalidateSession } from '$lib/server/auth';
import type { Actions } from '@sveltejs/kit';
import { redirect } from 'sveltekit-flash-message/server';

export const actions = {
	default: async ({ locals, cookies }) => {
		if (locals.session === null) {
			return redirect('/', { type: 'error', message: 'You are not logged in.' }, cookies);
		}
		await invalidateSession(locals.session.id);
		deleteSessionTokenCookie(cookies);

		return redirect('/', { type: 'error', message: 'Logout sucessful.' }, cookies);
	}
} satisfies Actions;
