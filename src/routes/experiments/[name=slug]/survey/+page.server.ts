import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { schema } from './schema.js';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { LibsqlError } from '@libsql/client';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod(schema));
	return { form };
};

export const actions = {
	default: async ({ request, params, cookies }) => {
		const form = await superValidate(request, zod(schema));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Invalid form data.' }, cookies);
			return fail(400, { form });
		}

		try {
			await db.insert(table.survey).values({ experiment: params.name, ...form.data });
		} catch (e) {
			if (e instanceof LibsqlError) {
				setFlash({ type: 'error', message: `Database error: ${e.message}` }, cookies);
			} else {
				setFlash({ type: 'error', message: `Unknown error: ${JSON.stringify(e)}` }, cookies);
			}
			return fail(400, { form });
		}

		return redirect('/experiments', { type: 'success', message: 'Survey saved.' }, cookies);
	}
} satisfies Actions;
