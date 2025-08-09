import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, eq, notInArray, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { error, type ActionFailure } from '@sveltejs/kit';
import { fail, superValidate, type SuperValidated } from 'sveltekit-superforms';
import { schema, type Schema } from './schema';
import { zod } from 'sveltekit-superforms/adapters';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { LibsqlError } from '@libsql/client';
import type { Cookies } from '@sveltejs/kit';

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

async function saveAnnotation(
	documentId: number,
	form: SuperValidated<Schema>,
	cookies: Cookies
): Promise<ActionFailure<{ form: SuperValidated<Schema> }> | undefined> {
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
}

async function updateDocuments(
	documentId: number,
	cookies: Cookies
): Promise<{ experimentId: number; documentIds: number[] }> {
	const [{ experimentId }] = await db
		.select({ experimentId: table.document.experimentId })
		.from(table.document)
		.where(eq(table.document.id, documentId));

	const cookie = cookies.get(experimentId.toString());
	const documentIds = JSON.parse(cookie ?? '[]');
	documentIds.push(documentId);
	cookies.set(experimentId.toString(), JSON.stringify(documentIds), { path: '/' });
	return { experimentId, documentIds };
}

export const actions = {
	next: async ({ request, params, cookies }) => {
		const documentId = parseInt(params.id);

		const form = await superValidate(request, zod(schema));

		const error = await saveAnnotation(documentId, form, cookies);

		if (error !== undefined) {
			return error;
		}

		const { experimentId, documentIds } = await updateDocuments(documentId, cookies);

		const queryset = await db
			.select()
			.from(table.document)
			.where(
				and(
					eq(table.document.experimentId, experimentId),
					notInArray(table.document.id, documentIds)
				)
			)
			.orderBy(sql`RANDOM()`)
			.limit(1);

		if (queryset.length === 0) {
			return redirect(
				`/experiments/${params.name}/survey`,
				{ type: 'error', message: 'Redirected to survey.' },
				cookies
			);
		}

		const [document] = queryset;
		return redirect(
			`/experiments/${params.name}/documents/${document.id}`,
			{ type: 'success', message: 'Annotation saved.' },
			cookies
		);
	},
	stop: async ({ request, params, cookies }) => {
		const documentId = parseInt(params.id);

		const form = await superValidate(request, zod(schema));

		const error = await saveAnnotation(documentId, form, cookies);

		if (error !== undefined) {
			return error;
		}

		await updateDocuments(documentId, cookies);

		return redirect(
			`/experiments/${params.name}/survey`,
			{ type: 'success', message: 'Annotation saved.' },
			cookies
		);
	}
} satisfies Actions;
