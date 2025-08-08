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

export const load: PageServerLoad = async ({ params, cookies }) => {
	const id = parseInt(params.id);
	const queryset = await db.select().from(table.document).where(eq(table.document.id, id));

	if (queryset.length === 0) {
		return error(404, 'Unknown document id.');
	}

	const [document] = queryset;

	const [experiment] = await db
		.select()
		.from(table.experiment)
		.where(eq(table.experiment.id, document.experimentId));

	const cookie = cookies.get(experiment.id.toString());
	const documentIds = JSON.parse(cookie ?? '[]');

	if (documentIds.includes(document.id)) {
		return redirect(
			'/experiments',
			{ type: 'error', message: 'Document already annotated.' },
			cookies
		);
	}

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

		const [{ experimentId }] = await db
			.select({ experimentId: table.document.experimentId })
			.from(table.document)
			.where(eq(table.document.id, documentId));

		const cookie = cookies.get(experimentId.toString());
		const documentIds = JSON.parse(cookie ?? '[]');
		documentIds.push(documentId);
		const value = JSON.stringify(documentIds);
		cookies.set(experimentId.toString(), value, { path: '/' });

		return redirect(
			`/experiments/${params.name}/survey`,
			{ type: 'success', message: 'Annotation saved.' },
			cookies
		);
	}
} satisfies Actions;
