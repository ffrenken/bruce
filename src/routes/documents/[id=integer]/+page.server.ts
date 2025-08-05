import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { fail, superValidate } from 'sveltekit-superforms';
import { schema } from './schema';
import { zod } from 'sveltekit-superforms/adapters';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { LibsqlError } from '@libsql/client';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseInt(params.id);
	const queryset = await db.select().from(table.document).where(eq(table.document.id, id));

	if (queryset.length === 0) {
		return error(404, 'Unknown document id.');
	}

	const [document] = queryset;

	const [experiment] = await db
		.select({ history: table.experiment.history })
		.from(table.experiment)
		.where(eq(table.experiment.name, document.experiment));

	const form = await superValidate(zod(schema));

	return { form, document, experiment };
};

export const actions = {
	default: async ({ request, params, cookies }) => {
		const documentId = parseInt(params.id);

		const form = await superValidate(request, zod(schema));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Invalid form data.' }, cookies);
			return fail(400, { form });
		}

		try {
			await db.insert(table.annotation).values({ documentId, ...form.data });
		} catch (e) {
			if (e instanceof LibsqlError) {
				setFlash({ type: 'error', message: `Database error: ${e.message}` }, cookies);
			} else {
				setFlash({ type: 'error', message: `Unknown error: ${JSON.stringify(e)}` }, cookies);
			}
			return fail(400, { form });
		}

		return redirect('/experiments', { type: 'success', message: 'Annotation saved.' }, cookies);
	}
} satisfies Actions;
