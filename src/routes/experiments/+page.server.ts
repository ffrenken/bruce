import type { Actions, PageServerLoad } from './$types';
import { fail, setError, superValidate, withFiles } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { creation, deletion } from './schema.js';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { setFlash } from 'sveltekit-flash-message/server';
import { LibsqlError } from '@libsql/client';
import { DocumentError, parseDocument } from '$lib';

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
			await db.transaction(async (tx) => {
				await tx.insert(table.experiment).values(form.data);

				for (const document of form.data.documents) {
					const text = await document.text();
					const content = [...parseDocument(document.name, text)];
					await tx
						.insert(table.document)
						.values({ name: document.name, content, experiment: form.data.name });
				}
			});
		} catch (e) {
			if (e instanceof DocumentError) {
				// @ts-expect-error missing overload still works
				// array errors do not show up in form by default
				setError(form, 'documents', e.message);
			} else if (e instanceof LibsqlError) {
				if (e.code == 'SQLITE_CONSTRAINT_PRIMARYKEY') {
					setError(form, 'name', 'Experiment name already exists.');
				} else {
					setFlash({ type: 'error', message: `Database error: ${e.message}` }, cookies);
				}
			} else {
				setFlash({ type: 'error', message: `Unknown error: ${JSON.stringify(e)}` }, cookies);
			}
			return fail(400, { form });
		}
		setFlash({ type: 'success', message: 'Experiment created.' }, cookies);
		return withFiles({ form });
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
