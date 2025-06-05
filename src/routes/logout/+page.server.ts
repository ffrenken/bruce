import { deleteSessionTokenCookie } from '$lib/server/auth';
import { invalidateSession } from '$lib/server/auth';
import type { Actions } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ locals, cookies }) => {
		if (locals.session === null) {
			return redirect(302, '/');
		}
		await invalidateSession(locals.session.id);
		deleteSessionTokenCookie(cookies);

		return redirect(302, '/');
	}
} satisfies Actions;
