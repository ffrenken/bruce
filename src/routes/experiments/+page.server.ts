import type { Actions, PageServerLoad } from './$types';
import { fail, setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { creation, deletion } from './schema.js';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { setFlash } from 'sveltekit-flash-message/server';
import { LibsqlError } from '@libsql/client';

export const load: PageServerLoad = async (event) => {
	const form = await superValidate(zod(creation));
	const experiments = await db.select().from(table.experiment).all();
	return { user: event.locals.user, form, experiments };
};

export const actions = {
	create: async ({ request, cookies }) => {
		const form = await superValidate(request, zod(creation));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await db.insert(table.experiment).values({ name: form.data.name });
		} catch (e) {
			if (e instanceof LibsqlError && e.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
				setError(form, 'name', 'Experiment name already exists.');
			} else {
				setError(form, '', 'Unknown database error.');
			}
			return fail(400, { form });
		}

		setFlash({ type: 'success', message: 'Experiment created.' }, cookies);
		return { form };
	},
	delete: async ({ request, cookies }) => {
		const form = await superValidate(request, zod(deletion));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await db.delete(table.experiment).where(eq(table.experiment.name, form.data.name));
		} catch {
			setFlash({ type: 'error', message: 'Unknown database error.' }, cookies);
			return fail(400, { form });
		}

		setFlash({ type: 'success', message: 'Experiment deleted.' }, cookies);
		return { form };
	}
} satisfies Actions;
